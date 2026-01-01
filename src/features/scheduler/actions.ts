"use server";

import { supabase } from "@/lib/supabase";
import { shiftSchema, ShiftFormValues, timeOffSchema } from "./schemas";
import { revalidatePath } from "next/cache";
import { addDays, startOfWeek, isSunday, format, startOfDay, endOfDay, isBefore } from "date-fns";
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

export async function generateSchedule(dateStr?: string) {
    const { data: employees } = await supabase.from("employees").select("*");
    if (!employees || employees.length === 0) return { error: "No employees found" };

    const referenceDate = dateStr ? new Date(dateStr) : new Date();
    const startOfCurrentWeek = startOfWeek(referenceDate, { weekStartsOn: WEEK_STARTS_ON });
    const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);

    const todayAbsolute = startOfDay(new Date());

    const { data: timeOffs } = await supabase
        .from("time_off_requests")
        .select("*")
        .gte("date", startOfCurrentWeek.toISOString())
        .lte("date", endOfCurrentWeek.toISOString());

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

        if (isBefore(currentDate, todayAbsolute)) {
            continue;
        }

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

            const slotStartTime = startDateTime.getTime();

            const alreadyExistsInDb = existingShifts?.some(s => {
                const shiftTime = new Date(s.start_time).getTime();
                return Math.abs(shiftTime - slotStartTime) < 60000;
            });

            const alreadyGenerated = newShiftsToInsert.some(s => {
                const shiftTime = new Date(s.start_time).getTime();
                return Math.abs(shiftTime - slotStartTime) < 60000;
            });

            if (alreadyExistsInDb || alreadyGenerated) {
                continue;
            }

            let pool = slot.requiresLeadership ? leadership : employees;
            pool = [...pool].sort(() => 0.5 - Math.random());

            const candidate = pool.find(emp => {
                if ((hoursUsed[emp.id] + slot.duration) > emp.max_hours_per_week) return false;

                const dateStr = format(currentDate, "yyyy-MM-dd");

                const hasTimeOff = timeOffs?.some(t =>
                    t.employee_id === emp.id && t.date === dateStr
                );
                if (hasTimeOff) return false;

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
                    start_time: startDateTime.toISOString(),
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

export async function deleteShift(id: number) {
    const { error } = await supabase
        .from("shifts")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Delete Error:", error);
        return { error: "Could not delete shift" };
    }

    revalidatePath("/");
    return { success: true };
}

export async function updateShift(id: number, data: ShiftFormValues) {
    const result = shiftSchema.safeParse(data);

    if (!result.success) {
        return { error: "Validation failed" };
    }

    const { date, start_time, end_time, employee_id } = result.data;

    const startDateTime = new Date(date);
    const [sh, sm] = start_time.split(":").map(Number);
    startDateTime.setHours(sh, sm, 0, 0);

    const endDateTime = new Date(date);
    const [eh, em] = end_time.split(":").map(Number);
    endDateTime.setHours(eh, em, 0, 0);

    const { error } = await supabase
        .from("shifts")
        .update({
            employee_id,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
        })
        .eq("id", id);

    if (error) {
        console.error("Update Error:", error);
        return { error: "Could not update shift" };
    }

    revalidatePath("/");
    return { success: true };
}

export async function getWeekStats(start: Date, end: Date) {
    const { data: shifts, error } = await supabase
        .from("shifts")
        .select(`
      start_time,
      end_time,
      employee:employees (
        hourly_rate
      )
    `)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString());

    if (error || !shifts) {
        return { totalShifts: 0, totalHours: 0, totalCost: 0 };
    }

    let totalHours = 0;
    let totalCost = 0;

    shifts.forEach((shift) => {
        const start = new Date(shift.start_time).getTime();
        const end = new Date(shift.end_time).getTime();

        const durationHours = (end - start) / (1000 * 60 * 60);

        // @ts-ignore
        const rate = shift.employee?.hourly_rate || 0;

        totalHours += durationHours;
        totalCost += durationHours * rate;
    });

    return {
        totalShifts: shifts.length,
        totalHours: Math.round(totalHours * 10) / 10,
        totalCost: Math.round(totalCost),
    };
}


export async function createTimeOffRequest(data: z.infer<typeof timeOffSchema>) {
    const { employee_id, date, reason } = data;

    const { error } = await supabase.from("time_off_requests").insert({
        employee_id,
        date: format(date, "yyyy-MM-dd"),
        reason,
    });

    if (error) {
        console.error("Time Off Error:", error);
        return { error: "Failed to request time off" };
    }

    revalidatePath("/");
    return { success: true };
}

export async function deleteTimeOffRequest(id: number) {
    const { error } = await supabase
        .from("time_off_requests")
        .delete()
        .eq("id", id);

    if (error) return { error: "Failed" };
    revalidatePath("/");
    return { success: true };
}