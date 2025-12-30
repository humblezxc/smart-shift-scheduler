"use server";

import { supabase } from "@/lib/supabase";
import { startOfDay, endOfDay } from "date-fns";
import { shiftSchema, ShiftFormValues } from "./schemas";
import { revalidatePath } from "next/cache";
import { addDays, startOfWeek, isSunday, format } from "date-fns";
import { WEEK_STARTS_ON } from "@/lib/date-utils";

export async function getShiftsForWeek(startOfWeek: Date, endOfWeek: Date) {
    const { data, error } = await supabase
        .from("shifts")
        .select(`
      *,
      employee:employees (
        first_name,
        last_name,
        role
      )
    `)
        .gte("start_time", startOfDay(startOfWeek).toISOString())
        .lte("start_time", endOfDay(endOfWeek).toISOString());

    if (error) {
        console.error("Error fetching shifts:", error);
        return [];
    }

    return data || [];
}

export async function createShift(data: ShiftFormValues) {
    const result = shiftSchema.safeParse(data);

    if (!result.success) {
        return { error: "Validation failed" };
    }

    const { date, start_time, end_time, employee_id } = result.data;

    const startDateTime = new Date(date);
    const [startHour, startMinute] = start_time.split(":").map(Number);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(date);
    const [endHour, endMinute] = end_time.split(":").map(Number);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    const { error } = await supabase.from("shifts").insert({
        employee_id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
    });

    if (error) {
        console.error("Db Error:", error);
        return { error: "Could not create shift" };
    }

    revalidatePath("/");
    return { success: true };
}

const IS_TRADING_SUNDAY = false;

type ShiftSlot = {
    start: string;
    end: string;
    duration: number;
    requiresLeadership?: boolean;
};

export async function generateSchedule() {
    const { data: employees } = await supabase.from("employees").select("*");
    if (!employees || employees.length === 0) return { error: "No employees found" };

    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });
    const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);

    const { data: existingShifts } = await supabase
        .from("shifts")
        .select("*")
        .gte("start_time", startOfCurrentWeek.toISOString())
        .lte("start_time", endOfDay(endOfCurrentWeek).toISOString());

    const leadership = employees.filter(e => e.role === "manager" || e.role === "owner");

    const newShiftsToInsert: { employee_id: number; start_time: string; end_time: string }[] = [];

    const hoursUsed: Record<number, number> = {};
    employees.forEach(emp => {
        const empShifts = existingShifts?.filter(s => s.employee_id === emp.id) || [];
        const totalHours = empShifts.reduce((acc, shift) => {
            const diff = new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime();
            return acc + (diff / (1000 * 60 * 60));
        }, 0);
        hoursUsed[emp.id] = totalHours;
    });

    for (let i = 0; i < 7; i++) {
        const currentDate = addDays(startOfCurrentWeek, i);
        const isSun = isSunday(currentDate);
        let slots: ShiftSlot[] = [];

        if (!isSun || IS_TRADING_SUNDAY) {
            slots = [
                { start: "06:00", end: "14:30", duration: 8.5 },
                { start: "14:30", end: "23:00", duration: 8.5 },
            ];
        } else {
            slots = [
                { start: "09:00", end: "15:00", duration: 6, requiresLeadership: true },
                { start: "15:00", end: "21:00", duration: 6, requiresLeadership: true }
            ];
        }

        for (const slot of slots) {
            const startDateTime = new Date(currentDate);
            const [sh, sm] = slot.start.split(":").map(Number);
            startDateTime.setHours(sh, sm, 0, 0);

            const endDateTime = new Date(currentDate);
            const [eh, em] = slot.end.split(":").map(Number);
            endDateTime.setHours(eh, em, 0, 0);

            const slotStartIso = startDateTime.toISOString();
            const alreadyExistsInDb = existingShifts?.some(s => s.start_time === slotStartIso);
            const alreadyGenerated = newShiftsToInsert.some(s => s.start_time === slotStartIso);

            if (alreadyExistsInDb || alreadyGenerated) {
                continue;
            }

            let pool = slot.requiresLeadership ? leadership : employees;
            pool = [...pool].sort(() => 0.5 - Math.random());

            const candidate = pool.find(emp => {
                if ((hoursUsed[emp.id] + slot.duration) > emp.max_hours_per_week) return false;

                const dateStr = format(currentDate, "yyyy-MM-dd");
                const worksInDbToday = existingShifts?.some(s =>
                    s.employee_id === emp.id && s.start_time.startsWith(dateStr)
                );
                const worksInNewToday = newShiftsToInsert.some(s =>
                    s.employee_id === emp.id && s.start_time.startsWith(dateStr)
                );

                return !worksInDbToday && !worksInNewToday;
            });

            if (candidate) {
                newShiftsToInsert.push({
                    employee_id: candidate.id,
                    start_time: slotStartIso,
                    end_time: endDateTime.toISOString(),
                });
                hoursUsed[candidate.id] += slot.duration;
            }
        }
    }

    if (newShiftsToInsert.length > 0) {
        const { error } = await supabase.from("shifts").insert(newShiftsToInsert);
        if (error) return { error: "Failed to save new shifts" };
    }

    revalidatePath("/");
    return { success: true, count: newShiftsToInsert.length };
}