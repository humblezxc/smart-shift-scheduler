"use server";

import { createSupabaseServerClient, requireOrganization, requireRole, getOrgScheduleConfig } from "@/lib/supabase-server";
import { shiftSchema, ShiftFormValues, timeOffSchema } from "./schemas";
import { revalidatePath } from "next/cache";
import { addDays, startOfWeek, isSunday, format, startOfDay, endOfDay, isBefore, getISOWeek, startOfMonth, endOfMonth } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { z } from "zod";

async function getOrgId() {
    const userOrg = await requireOrganization();
    return userOrg.organization_id;
}

async function getOrgTimezone(orgId: string): Promise<string> {
    const { timezone } = await getOrgScheduleConfig(orgId);
    return timezone;
}

function formatInTz(date: Date, fmt: string, tz: string): string {
    return formatInTimeZone(date, tz, fmt);
}

function buildTimestamp(dateStr: string, timeStr: string, tz: string): string {
    const noonRef = new Date(`${dateStr}T12:00:00Z`);
    const offset = formatInTimeZone(noonRef, tz, "xxx");
    return `${dateStr}T${timeStr}:00${offset}`;
}

export async function getShiftsForWeek(startOfWeek: Date, endOfWeek: Date) {
    const supabase = await createSupabaseServerClient();
    const orgId = await getOrgId();

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
        .eq("organization_id", orgId)
        .gte("start_time", startOfDay(startOfWeek).toISOString())
        .lte("start_time", endOfDay(endOfWeek).toISOString());

    if (error) {
        return [];
    }

    return data || [];
}

export async function createShift(data: ShiftFormValues) {
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;

    const result = shiftSchema.safeParse(data);

    if (!result.success) {
        return { error: "Validation failed" };
    }

    const supabase = await createSupabaseServerClient();

    const { date, start_time, end_time, employee_id } = result.data;
    const dateStr = format(new Date(date), "yyyy-MM-dd");
    const tz = await getOrgTimezone(orgId);

    const { data: employee } = await supabase
        .from("employees")
        .select("hourly_rate")
        .eq("id", employee_id)
        .eq("organization_id", orgId)
        .single();

    const { error } = await supabase.from("shifts").insert({
        employee_id,
        organization_id: orgId,
        start_time: buildTimestamp(dateStr, start_time, tz),
        end_time: buildTimestamp(dateStr, end_time, tz),
        hourly_rate: employee?.hourly_rate || 0,
    });

    if (error) {
        return { error: "Could not create shift" };
    }

    revalidatePath("/");
    return { success: true };
}

export async function generateSchedule(dateStr?: string) {
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;
    const supabase = await createSupabaseServerClient();
    const { timezone: tz, weekStartsOn } = await getOrgScheduleConfig(orgId);

    const { data: employees } = await supabase
        .from("employees")
        .select("*")
        .eq("organization_id", orgId);

    if (!employees || employees.length === 0) return { error: "No employees found" };

    const referenceDate = dateStr ? new Date(dateStr) : new Date();
    const startOfCurrentWeek = startOfWeek(referenceDate, { weekStartsOn });
    const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);
    const todayAbsolute = startOfDay(new Date());

    const weekNumber = getISOWeek(startOfCurrentWeek);
    const yearStart = format(startOfCurrentWeek, "yyyy-01-01");
    const yearEnd = format(endOfCurrentWeek, "yyyy-12-31");

    const [timeOffsReq, holidaysReq, existingShiftsReq] = await Promise.all([
        supabase.from("time_off_requests").select("*").eq("organization_id", orgId).gte("date", startOfCurrentWeek.toISOString()).lte("date", endOfCurrentWeek.toISOString()),
        supabase.from("holidays").select("*").eq("organization_id", orgId).gte("date", yearStart).lte("date", yearEnd),
        supabase.from("shifts").select("*").eq("organization_id", orgId).gte("start_time", startOfCurrentWeek.toISOString()).lte("start_time", endOfDay(endOfCurrentWeek).toISOString())
    ]);

    const timeOffs = timeOffsReq.data || [];
    const holidays = holidaysReq.data || [];
    let existingShifts = existingShiftsReq.data || [];

    const owners = employees.filter(e => e.role === "owner");
    const managers = employees.filter(e => e.role === "manager");

    const staff = employees
        .filter(e => e.role === "cashier" || e.role === "student")
        .sort((a, b) => a.id - b.id);

    let primaryMorningWorker: typeof employees[0];
    let primaryEveningWorker: typeof employees[0];
    let reservePool: typeof employees = [];

    if (staff.length >= 2) {
        const isEvenWeek = weekNumber % 2 === 0;
        if (isEvenWeek) {
            primaryMorningWorker = staff[0];
            primaryEveningWorker = staff[1];
        } else {
            primaryMorningWorker = staff[1];
            primaryEveningWorker = staff[0];
        }
        reservePool = staff.slice(2);
    } else {
        primaryMorningWorker = staff[0];
        primaryEveningWorker = staff[0];
    }

    const newShiftsToInsert: { employee_id: number; organization_id: string; start_time: string; end_time: string, hourly_rate: number }[] = [];

    const isAvailable = (empId: number, dateStr: string, startTimeIso: string) => {
        if (timeOffs.some(t => t.employee_id === empId && t.date === dateStr)) return false;
        if (existingShifts.some(s => s.employee_id === empId && formatInTz(new Date(s.start_time), "yyyy-MM-dd", tz) === dateStr)) return false;
        if (newShiftsToInsert.some(s => s.employee_id === empId && formatInTz(new Date(s.start_time), "yyyy-MM-dd", tz) === dateStr)) return false;
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
        const hasHolidayRecord = holidays.some(h => h.date === dateStr);
        const dayOfWeek = format(currentDate, 'iiii');

        const isSpecialDay = isSun ? !hasHolidayRecord : hasHolidayRecord;
        const idsToDelete: number[] = [];

        existingShifts = existingShifts.filter(shift => {
            const shiftDateStr = formatInTz(new Date(shift.start_time), "yyyy-MM-dd", tz);
            if (shiftDateStr !== dateStr) return true;

            const h = parseInt(formatInTz(new Date(shift.start_time), "H", tz), 10);
            const m = parseInt(formatInTz(new Date(shift.start_time), "m", tz), 10);

            let shouldDelete = false;

            if (isSpecialDay) {
                if ((h === 5 && m === 30) || (h === 14 && m === 30)) {
                    shouldDelete = true;
                }
            } else {
                if ((h === 9 && m === 0) || (h === 15 && m === 0)) {
                    shouldDelete = true;
                }
            }

            if (shouldDelete) {
                idsToDelete.push(shift.id);
                return false;
            }
            return true;
        });

        if (idsToDelete.length > 0) {
            await supabase.from("shifts").delete().in("id", idsToDelete);
        }

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
            const slotTimestamp = buildTimestamp(dateStr, slot.start, tz);
            const slotTimeMs = new Date(slotTimestamp).getTime();

            const isSlotTaken = existingShifts.some(s => {
                const sDateStr = formatInTz(new Date(s.start_time), "yyyy-MM-dd", tz);
                if (sDateStr !== dateStr) return false;
                const sTime = new Date(s.start_time).getTime();
                const diffHours = Math.abs(sTime - slotTimeMs) / (1000 * 60 * 60);
                return diffHours < 3;
            }) || newShiftsToInsert.some(s => {
                const sDateStr = formatInTz(new Date(s.start_time), "yyyy-MM-dd", tz);
                if (sDateStr !== dateStr) return false;
                const sTime = new Date(s.start_time).getTime();
                const diffHours = Math.abs(sTime - slotTimeMs) / (1000 * 60 * 60);
                return diffHours < 3;
            });

            if (isSlotTaken) continue;

            let assignedWorker: typeof employees[0] | null | undefined = null;

            if (isSpecialDay) {
                if (slot.type === 'morning') {
                    assignedWorker = owners.find(o => isAvailable(o.id, dateStr, slotTimestamp));
                } else {
                    assignedWorker = managers.find(m => isAvailable(m.id, dateStr, slotTimestamp));
                    if (!assignedWorker) {
                        assignedWorker = findWorker(primaryEveningWorker, [...reservePool, primaryMorningWorker], dateStr, slotTimestamp);
                    }
                }
            } else {
                if (slot.type === 'morning') {
                    if (dayOfWeek === 'Saturday') {
                        assignedWorker = managers.find(m => isAvailable(m.id, dateStr, slotTimestamp));
                        if (!assignedWorker) {
                            assignedWorker = findWorker(primaryMorningWorker, [...reservePool, primaryEveningWorker], dateStr, slotTimestamp);
                        }
                    } else {
                        assignedWorker = findWorker(primaryMorningWorker, [...reservePool, primaryEveningWorker], dateStr, slotTimestamp);
                    }
                } else {
                    assignedWorker = findWorker(primaryEveningWorker, [...reservePool, primaryMorningWorker], dateStr, slotTimestamp);
                }
            }

            if (assignedWorker) {
                newShiftsToInsert.push({
                    employee_id: assignedWorker.id,
                    organization_id: orgId,
                    start_time: buildTimestamp(dateStr, slot.start, tz),
                    end_time: buildTimestamp(dateStr, slot.end, tz),
                    hourly_rate: assignedWorker.hourly_rate || 0
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
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("shifts")
        .delete()
        .eq("id", id)
        .eq("organization_id", orgId);

    if (error) {
        return { error: "Could not delete shift" };
    }
    revalidatePath("/");
    return { success: true };
}

export async function updateShift(id: number, data: ShiftFormValues) {
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;

    const result = shiftSchema.safeParse(data);
    if (!result.success) return { error: "Validation failed" };

    const supabase = await createSupabaseServerClient();

    const { date, start_time, end_time, employee_id } = result.data;
    const dateStr = format(new Date(date), "yyyy-MM-dd");
    const tz = await getOrgTimezone(orgId);

    const { error } = await supabase
        .from("shifts")
        .update({
            employee_id,
            start_time: buildTimestamp(dateStr, start_time, tz),
            end_time: buildTimestamp(dateStr, end_time, tz),
        })
        .eq("id", id)
        .eq("organization_id", orgId);

    if (error) {
        return { error: "Could not update shift" };
    }
    revalidatePath("/");
    return { success: true };
}

export async function moveShiftToDate(shiftId: number, newDate: string) {
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;
    const supabase = await createSupabaseServerClient();

    const { data: shift } = await supabase
        .from("shifts")
        .select("*")
        .eq("id", shiftId)
        .eq("organization_id", orgId)
        .single();

    if (!shift) return { error: "Shift not found" };

    const tz = await getOrgTimezone(orgId);
    const startTime = formatInTz(new Date(shift.start_time), "HH:mm", tz);
    const endTime = formatInTz(new Date(shift.end_time), "HH:mm", tz);

    const { error } = await supabase
        .from("shifts")
        .update({
            start_time: buildTimestamp(newDate, startTime, tz),
            end_time: buildTimestamp(newDate, endTime, tz),
        })
        .eq("id", shiftId)
        .eq("organization_id", orgId);

    if (error) {
        return { error: "Could not move shift" };
    }

    revalidatePath("/");
    return { success: true };
}

export async function swapShiftTimes(shiftId1: number, shiftId2: number) {
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;
    const supabase = await createSupabaseServerClient();

    const { data: shifts } = await supabase
        .from("shifts")
        .select("*")
        .in("id", [shiftId1, shiftId2])
        .eq("organization_id", orgId);

    if (!shifts || shifts.length !== 2) return { error: "Shifts not found" };

    const shift1 = shifts.find(s => s.id === shiftId1)!;
    const shift2 = shifts.find(s => s.id === shiftId2)!;

    const tz = await getOrgTimezone(orgId);
    const date1 = formatInTz(new Date(shift1.start_time), "yyyy-MM-dd", tz);
    const date2 = formatInTz(new Date(shift2.start_time), "yyyy-MM-dd", tz);
    const start1 = formatInTz(new Date(shift1.start_time), "HH:mm", tz);
    const end1 = formatInTz(new Date(shift1.end_time), "HH:mm", tz);
    const start2 = formatInTz(new Date(shift2.start_time), "HH:mm", tz);
    const end2 = formatInTz(new Date(shift2.end_time), "HH:mm", tz);

    const { error: error1 } = await supabase
        .from("shifts")
        .update({
            start_time: buildTimestamp(date1, start2, tz),
            end_time: buildTimestamp(date1, end2, tz),
        })
        .eq("id", shiftId1)
        .eq("organization_id", orgId);

    const { error: error2 } = await supabase
        .from("shifts")
        .update({
            start_time: buildTimestamp(date2, start1, tz),
            end_time: buildTimestamp(date2, end1, tz),
        })
        .eq("id", shiftId2)
        .eq("organization_id", orgId);

    if (error1 || error2) {
        return { error: "Could not swap shifts" };
    }

    revalidatePath("/");
    return { success: true };
}

export async function getWeekStats(start: Date, end: Date) {
    const supabase = await createSupabaseServerClient();
    const orgId = await getOrgId();

    const { data: shifts, error } = await supabase
        .from("shifts")
        .select(`
      start_time,
      end_time,
      employee:employees (
        hourly_rate
      )
    `)
        .eq("organization_id", orgId)
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

        const employeeData = shift.employee;
        const emp = Array.isArray(employeeData) ? employeeData[0] : employeeData;
        const rate = (emp as any)?.hourly_rate || 0;

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
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;
    const supabase = await createSupabaseServerClient();

    const { employee_id, date, reason } = data;
    const { error } = await supabase.from("time_off_requests").insert({
        employee_id,
        organization_id: orgId,
        date: format(date, "yyyy-MM-dd"),
        reason,
    });
    if (error) {
        return { error: "Failed to request time off" };
    }
    revalidatePath("/");
    return { success: true };
}

export async function deleteTimeOffRequest(id: number) {
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("time_off_requests")
        .delete()
        .eq("id", id)
        .eq("organization_id", orgId);

    if (error) return { error: "Failed" };
    revalidatePath("/");
    return { success: true };
}

export async function toggleHoliday(date: Date) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;
    const supabase = await createSupabaseServerClient();

    const dateStr = format(date, "yyyy-MM-dd");
    const { data } = await supabase
        .from("holidays")
        .select("*")
        .eq("date", dateStr)
        .eq("organization_id", orgId)
        .single();

    if (data) {
        await supabase.from("holidays").delete().eq("date", dateStr).eq("organization_id", orgId);
    } else {
        await supabase.from("holidays").insert({ date: dateStr, name: "Holiday", organization_id: orgId });
    }
    revalidatePath("/");
}

export async function getDetailedStats(period: 'month' | 'all', date: Date) {
    const supabase = await createSupabaseServerClient();
    const orgId = await getOrgId();

    let query = supabase
        .from("shifts")
        .select(`
      id,
      start_time,
      end_time,
      hourly_rate,
      employee:employees (
        id,
        first_name,
        last_name,
        role,
        hourly_rate
      )
    `)
        .eq("organization_id", orgId);

    if (period === 'month') {
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        query = query
            .gte("start_time", start.toISOString())
            .lte("start_time", end.toISOString());
    }

    const { data: shifts, error } = await query;

    if (error || !shifts) return null;

    const statsByEmployee: Record<number, {
        name: string,
        role: string,
        hours: number,
        earned: number
    }> = {};

    let staffTotalEarned = 0;

    shifts.forEach((shift) => {
        const employeeData = shift.employee;
        const emp = Array.isArray(employeeData) ? employeeData[0] : employeeData;
        const safeEmp = emp as any;

        if (!safeEmp) return;

        const start = new Date(shift.start_time).getTime();
        const end = new Date(shift.end_time).getTime();
        const hours = (end - start) / (1000 * 60 * 60);

        const rate = shift.hourly_rate ?? safeEmp.hourly_rate ?? 0;
        const earned = hours * rate;

        const empId = safeEmp.id;
        const empName = `${safeEmp.first_name} ${safeEmp.last_name}`;
        const role = safeEmp.role;

        if (!statsByEmployee[empId]) {
            statsByEmployee[empId] = { name: empName, role, hours: 0, earned: 0 };
        }
        statsByEmployee[empId].hours += hours;
        statsByEmployee[empId].earned += earned;

        if (role === 'student' || role === 'cashier') {
            staffTotalEarned += earned;
        }
    });

    return {
        byEmployee: Object.values(statsByEmployee),
        staffTotalEarned: Math.round(staffTotalEarned),
        totalShifts: shifts.length
    };
}

export async function getDetailedStatsByRange(
    startDate: Date,
    endDate: Date,
    employeeId?: string
) {
    const supabase = await createSupabaseServerClient();
    const orgId = await getOrgId();

    let query = supabase
        .from("shifts")
        .select(`
      id, start_time, end_time, hourly_rate,
      employee:employees (id, first_name, last_name, role, hourly_rate)
    `)
        .eq("organization_id", orgId)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString());

    if (employeeId) {
        query = query.eq("employee_id", employeeId);
    }

    const { data: shifts, error } = await query;
    if (error || !shifts) return null;

    const statsByEmployee: Record<string, { name: string; role: string; hours: number; earned: number }> = {};
    let staffTotalEarned = 0;

    shifts.forEach((shift) => {
        const employeeData = shift.employee;
        const emp = Array.isArray(employeeData) ? employeeData[0] : employeeData;
        const safeEmp = emp as any;
        if (!safeEmp) return;

        const hours = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3_600_000;
        const rate = shift.hourly_rate ?? safeEmp.hourly_rate ?? 0;
        const earned = hours * rate;
        const empId = safeEmp.id;
        const empName = `${safeEmp.first_name} ${safeEmp.last_name}`;
        const role = safeEmp.role;

        if (!statsByEmployee[empId]) {
            statsByEmployee[empId] = { name: empName, role, hours: 0, earned: 0 };
        }
        statsByEmployee[empId].hours += hours;
        statsByEmployee[empId].earned += earned;

        if (role === 'student' || role === 'cashier') {
            staffTotalEarned += earned;
        }
    });

    const shiftBreakdown = employeeId
        ? shifts.map((s) => {
            const hours = (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 3_600_000;
            const emp = Array.isArray(s.employee) ? s.employee[0] : s.employee as any;
            const rate = s.hourly_rate ?? (emp as any)?.hourly_rate ?? 0;
            return {
                startTs: s.start_time,
                endTs: s.end_time,
                hours,
                earned: hours * rate,
            };
        }).sort((a, b) => a.startTs.localeCompare(b.startTs))
        : undefined;

    return {
        byEmployee: Object.values(statsByEmployee),
        staffTotalEarned: Math.round(staffTotalEarned),
        totalShifts: shifts.length,
        shifts: shiftBreakdown,
    };
}

export async function getMonthShifts(date: Date) {
    const supabase = await createSupabaseServerClient();
    const orgId = await getOrgId();

    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("organization_id", orgId)
        .gte("start_time", start.toISOString())
        .lte("end_time", end.toISOString());

    if (error) {
        return [];
    }
    return data;
}
