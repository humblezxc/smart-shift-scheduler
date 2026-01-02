"use server";

import { supabase } from "@/lib/supabase";
import { shiftSchema, ShiftFormValues, timeOffSchema } from "./schemas";
import { revalidatePath } from "next/cache";
import { addDays, startOfWeek, isSunday, format, startOfDay, endOfDay, isBefore, subDays } from "date-fns";
import { WEEK_STARTS_ON } from "@/lib/date-utils";
import { z } from "zod";

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

    const [timeOffsReq, holidaysReq, existingShiftsReq] = await Promise.all([
        supabase.from("time_off_requests").select("*").gte("date", startOfCurrentWeek.toISOString()).lte("date", endOfCurrentWeek.toISOString()),
        supabase.from("holidays").select("*").gte("date", startOfCurrentWeek.toISOString()).lte("date", endOfCurrentWeek.toISOString()),
        supabase.from("shifts").select("*").gte("start_time", startOfCurrentWeek.toISOString()).lte("start_time", endOfDay(endOfCurrentWeek).toISOString())
    ]);

    const timeOffs = timeOffsReq.data || [];
    const holidays = holidaysReq.data || [];
    const existingShifts = existingShiftsReq.data || [];

    const owners = employees.filter(e => e.role === "owner");
    const managers = employees.filter(e => e.role === "manager");

    const staff = employees
        .filter(e => e.role === "cashier" || e.role === "student")
        .sort(() => 0.5 - Math.random());

    const primaryMorningWorker = staff[0];
    const primaryEveningWorker = staff.length > 1 ? staff[1] : staff[0];
    const reservePool = staff.slice(2);

    const newShiftsToInsert: { employee_id: number; start_time: string; end_time: string }[] = [];

    const isAvailable = (empId: number, dateStr: string, startTimeIso: string) => {
        if (timeOffs.some(t => t.employee_id === empId && t.date === dateStr)) return false;

        if (existingShifts.some(s => s.employee_id === empId && s.start_time.startsWith(dateStr))) return false;
        if (newShiftsToInsert.some(s => s.employee_id === empId && s.start_time.startsWith(dateStr))) return false;

        return true;
    };

    const findWorker = (priorityEmp: typeof employees[0] | undefined, backupPool: typeof employees, dateStr: string, slotIso: string) => {
        if (priorityEmp && isAvailable(priorityEmp.id, dateStr, slotIso)) return priorityEmp;
        const backup = backupPool.find(e => isAvailable(e.id, dateStr, slotIso));
        if (backup) return backup;
        const manager = managers.find(m => isAvailable(m.id, dateStr, slotIso));
        if (manager) return manager;
        return null;
    };

    for (let i = 0; i < 7; i++) {
        const currentDate = addDays(startOfCurrentWeek, i);
        const dateStr = format(currentDate, "yyyy-MM-dd");

        if (isBefore(currentDate, todayAbsolute)) continue;

        const isSun = isSunday(currentDate);
        const isHoliday = holidays.some(h => h.date === dateStr);
        const isSpecialDay = isSun || isHoliday;
        const dayOfWeek = format(currentDate, 'iiii');

        let slots: { start: string, end: string, type: 'morning' | 'evening' }[] = [];

        if (isSpecialDay) {
            slots = [
                { start: "09:00", end: "15:00", type: 'morning' },
                { start: "15:00", end: "21:00", type: 'evening' }
            ];
        } else {
            slots = [
                { start: "05:30", end: "14:30", type: 'morning' },
                { start: "14:30", end: "23:00", type: 'evening' }
            ];
        }

        for (const slot of slots) {
            const startDateTime = new Date(dateStr + "T" + slot.start + ":00");
            const endDateTime = new Date(dateStr + "T" + slot.end + ":00");
            const slotIso = startDateTime.toISOString();
            const slotTimeMs = startDateTime.getTime();

            const isSlotTaken = existingShifts.some(s => {
                const sTime = new Date(s.start_time).getTime();
                const diffHours = Math.abs(sTime - slotTimeMs) / (1000 * 60 * 60);
                return diffHours < 3; // Якщо є зміна в межах +/- 3 годин
            }) || newShiftsToInsert.some(s => {
                const sTime = new Date(s.start_time).getTime();
                const diffHours = Math.abs(sTime - slotTimeMs) / (1000 * 60 * 60);
                return diffHours < 3;
            });

            if (isSlotTaken) {
                continue;
            }

            let assignedWorker: typeof employees[0] | null | undefined = null;

            if (isSpecialDay) {
                if (slot.type === 'morning') {
                    assignedWorker = owners.find(o => isAvailable(o.id, dateStr, slotIso));
                } else {
                    assignedWorker = managers.find(m => isAvailable(m.id, dateStr, slotIso));
                    if (!assignedWorker) {
                        assignedWorker = findWorker(primaryEveningWorker, [...reservePool, primaryMorningWorker], dateStr, slotIso);
                    }
                }
            } else {
                if (slot.type === 'morning') {
                    if (dayOfWeek === 'Saturday') {
                        assignedWorker = managers.find(m => isAvailable(m.id, dateStr, slotIso));
                        if (!assignedWorker) {
                            assignedWorker = findWorker(primaryMorningWorker, [...reservePool, primaryEveningWorker], dateStr, slotIso);
                        }
                    } else {
                        assignedWorker = findWorker(primaryMorningWorker, [...reservePool, primaryEveningWorker], dateStr, slotIso);
                    }
                } else {
                    assignedWorker = findWorker(primaryEveningWorker, [...reservePool, primaryMorningWorker], dateStr, slotIso);
                }
            }

            if (assignedWorker) {
                newShiftsToInsert.push({
                    employee_id: assignedWorker.id,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString()
                });
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

export async function toggleHoliday(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");

    const { data } = await supabase.from("holidays").select("*").eq("date", dateStr).single();

    if (data) {
        await supabase.from("holidays").delete().eq("date", dateStr);
    } else {
        await supabase.from("holidays").insert({ date: dateStr, name: "Holiday" });
    }
    revalidatePath("/");
}