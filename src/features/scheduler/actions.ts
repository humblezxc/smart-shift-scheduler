"use server";

import { createSupabaseServerClient, requireOrganization, requireRole, getOrgScheduleConfig } from "@/lib/supabase-server";
import { shiftSchema, ShiftFormValues, timeOffSchema } from "./schemas";
import { revalidatePath, updateTag } from "next/cache";
import { cacheTags } from "@/lib/supabase-admin";
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
      id, employee_id, start_time, end_time, hourly_rate,
      employee:employees ( first_name, last_name, role )
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
    const endDateStr = end_time <= start_time ? format(addDays(new Date(date), 1), "yyyy-MM-dd") : dateStr;

    const [tz, employeeRes] = await Promise.all([
        getOrgTimezone(orgId).catch(() => null),
        supabase
            .from("employees")
            .select("hourly_rate")
            .eq("id", employee_id)
            .eq("organization_id", orgId)
            .maybeSingle(),
    ]);

    if (!tz) {
        return { error: "Could not load organization settings" };
    }
    if (employeeRes.error || !employeeRes.data) {
        return { error: "Employee not found" };
    }

    const { error } = await supabase.from("shifts").insert({
        employee_id,
        organization_id: orgId,
        start_time: buildTimestamp(dateStr, start_time, tz),
        end_time: buildTimestamp(endDateStr, end_time, tz),
        hourly_rate: employeeRes.data.hourly_rate || 0,
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
    const scheduleConfig = await getOrgScheduleConfig(orgId).catch(() => null);
    if (!scheduleConfig) {
        return { error: "Could not load organization settings" };
    }
    const { timezone: tz, weekStartsOn } = scheduleConfig;

    const { data: employees } = await supabase
        .from("employees")
        .select("id, role, hourly_rate")
        .eq("organization_id", orgId)
        .is("archived_at", null);

    if (!employees || employees.length === 0) return { error: "No employees found" };

    const referenceDate = dateStr ? new Date(dateStr) : new Date();
    const startOfCurrentWeek = startOfWeek(referenceDate, { weekStartsOn });
    const endOfCurrentWeek = addDays(startOfCurrentWeek, 6);
    const todayAbsolute = startOfDay(new Date());

    const weekNumber = getISOWeek(startOfCurrentWeek);
    const yearStart = format(startOfCurrentWeek, "yyyy-01-01");
    const yearEnd = format(endOfCurrentWeek, "yyyy-12-31");

    const [timeOffsReq, holidaysReq, existingShiftsReq] = await Promise.all([
        supabase.from("time_off_requests").select("employee_id, date").eq("organization_id", orgId).gte("date", format(startOfCurrentWeek, "yyyy-MM-dd")).lte("date", format(endOfCurrentWeek, "yyyy-MM-dd")),
        supabase.from("holidays").select("date").eq("organization_id", orgId).gte("date", yearStart).lte("date", yearEnd),
        supabase.from("shifts").select("id, employee_id, start_time").eq("organization_id", orgId).gte("start_time", startOfCurrentWeek.toISOString()).lte("start_time", endOfDay(endOfCurrentWeek).toISOString())
    ]);

    const timeOffs = timeOffsReq.data || [];
    const holidays = holidaysReq.data || [];
    type ExistingShift = { id: number; employee_id: number; start_time: string; _dateStr: string; _h: number; _m: number; _ms: number };
    let existingShifts: ExistingShift[] = (existingShiftsReq.data || []).map(s => {
        const d = new Date(s.start_time);
        return {
            ...s,
            _dateStr: formatInTz(d, "yyyy-MM-dd", tz),
            _h: parseInt(formatInTz(d, "H", tz), 10),
            _m: parseInt(formatInTz(d, "m", tz), 10),
            _ms: d.getTime(),
        };
    });

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

    type NewShift = { employee_id: number; organization_id: string; start_time: string; end_time: string; hourly_rate: number; _dateStr: string };
    const newShiftsToInsert: NewShift[] = [];
    const allIdsToDelete: number[] = [];

    const timeOffByEmpDate = new Set<string>();
    for (const t of timeOffs) timeOffByEmpDate.add(`${t.employee_id}|${t.date}`);

    const isAvailable = (empId: number, dateStr: string) => {
        if (timeOffByEmpDate.has(`${empId}|${dateStr}`)) return false;
        for (const s of existingShifts) {
            if (s.employee_id === empId && s._dateStr === dateStr) return false;
        }
        for (const s of newShiftsToInsert) {
            if (s.employee_id === empId && s._dateStr === dateStr) return false;
        }
        return true;
    };

    const findWorker = (priorityEmp: typeof employees[0] | undefined, backupPool: typeof employees, dateStr: string) => {
        if (priorityEmp && isAvailable(priorityEmp.id, dateStr)) return priorityEmp;
        const backup = backupPool.find(e => isAvailable(e.id, dateStr));
        if (backup) return backup;
        const manager = managers.find(m => isAvailable(m.id, dateStr));
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

        existingShifts = existingShifts.filter(shift => {
            if (shift._dateStr !== dateStr) return true;
            const h = shift._h;
            const m = shift._m;

            const shouldDelete = isSpecialDay
                ? (h === 5 && m === 30) || (h === 14 && m === 30)
                : (h === 9 && m === 0) || (h === 15 && m === 0);

            if (shouldDelete) {
                allIdsToDelete.push(shift.id);
                return false;
            }
            return true;
        });

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

            let isSlotTaken = false;
            for (const s of existingShifts) {
                if (s._dateStr === dateStr && Math.abs(s._ms - slotTimeMs) < 3 * 3600 * 1000) {
                    isSlotTaken = true;
                    break;
                }
            }
            if (!isSlotTaken) {
                for (const s of newShiftsToInsert) {
                    if (s._dateStr === dateStr) {
                        const sTime = new Date(s.start_time).getTime();
                        if (Math.abs(sTime - slotTimeMs) < 3 * 3600 * 1000) {
                            isSlotTaken = true;
                            break;
                        }
                    }
                }
            }

            if (isSlotTaken) continue;

            let assignedWorker: typeof employees[0] | null | undefined = null;

            if (isSpecialDay) {
                if (slot.type === 'morning') {
                    assignedWorker = owners.find(o => isAvailable(o.id, dateStr));
                } else {
                    assignedWorker = managers.find(m => isAvailable(m.id, dateStr));
                    if (!assignedWorker) {
                        assignedWorker = findWorker(primaryEveningWorker, [...reservePool, primaryMorningWorker], dateStr);
                    }
                }
            } else {
                if (slot.type === 'morning') {
                    if (dayOfWeek === 'Saturday') {
                        assignedWorker = managers.find(m => isAvailable(m.id, dateStr));
                        if (!assignedWorker) {
                            assignedWorker = findWorker(primaryMorningWorker, [...reservePool, primaryEveningWorker], dateStr);
                        }
                    } else {
                        assignedWorker = findWorker(primaryMorningWorker, [...reservePool, primaryEveningWorker], dateStr);
                    }
                } else {
                    assignedWorker = findWorker(primaryEveningWorker, [...reservePool, primaryMorningWorker], dateStr);
                }
            }

            if (assignedWorker) {
                newShiftsToInsert.push({
                    employee_id: assignedWorker.id,
                    organization_id: orgId,
                    start_time: slotTimestamp,
                    end_time: buildTimestamp(dateStr, slot.end, tz),
                    hourly_rate: assignedWorker.hourly_rate || 0,
                    _dateStr: dateStr,
                });
            }
        }
    }

    const [delRes, insRes] = await Promise.all([
        allIdsToDelete.length > 0
            ? supabase.from("shifts").delete().in("id", allIdsToDelete)
            : Promise.resolve({ error: null }),
        newShiftsToInsert.length > 0
            ? supabase.from("shifts").insert(newShiftsToInsert.map(({ _dateStr, ...rest }) => rest))
            : Promise.resolve({ error: null }),
    ]);

    if (delRes.error || insRes.error) {
        return { error: "Failed to save new shifts" };
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
    const endDateStr = end_time <= start_time ? format(addDays(new Date(date), 1), "yyyy-MM-dd") : dateStr;

    const [tz, employeeRes] = await Promise.all([
        getOrgTimezone(orgId).catch(() => null),
        supabase
            .from("employees")
            .select("hourly_rate")
            .eq("id", employee_id)
            .eq("organization_id", orgId)
            .maybeSingle(),
    ]);

    if (!tz) {
        return { error: "Could not load organization settings" };
    }
    if (employeeRes.error || !employeeRes.data) {
        return { error: "Employee not found" };
    }

    const { error } = await supabase
        .from("shifts")
        .update({
            employee_id,
            start_time: buildTimestamp(dateStr, start_time, tz),
            end_time: buildTimestamp(endDateStr, end_time, tz),
            hourly_rate: employeeRes.data.hourly_rate || 0,
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

    const tz = await getOrgTimezone(orgId).catch(() => null);
    if (!tz) {
        return { error: "Could not load organization settings" };
    }
    const startTime = formatInTz(new Date(shift.start_time), "HH:mm", tz);
    const endTime = formatInTz(new Date(shift.end_time), "HH:mm", tz);
    const endDateStr = endTime <= startTime ? format(addDays(new Date(newDate), 1), "yyyy-MM-dd") : newDate;

    const { error } = await supabase
        .from("shifts")
        .update({
            start_time: buildTimestamp(newDate, startTime, tz),
            end_time: buildTimestamp(endDateStr, endTime, tz),
        })
        .eq("id", shiftId)
        .eq("organization_id", orgId);

    if (error) {
        return { error: "Could not move shift" };
    }

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

    const tz = await getOrgTimezone(orgId).catch(() => null);
    if (!tz) {
        return { error: "Could not load organization settings" };
    }
    const date1 = formatInTz(new Date(shift1.start_time), "yyyy-MM-dd", tz);
    const date2 = formatInTz(new Date(shift2.start_time), "yyyy-MM-dd", tz);
    const start1 = formatInTz(new Date(shift1.start_time), "HH:mm", tz);
    const end1 = formatInTz(new Date(shift1.end_time), "HH:mm", tz);
    const start2 = formatInTz(new Date(shift2.start_time), "HH:mm", tz);
    const end2 = formatInTz(new Date(shift2.end_time), "HH:mm", tz);
    const endDate1 = end2 <= start2 ? format(addDays(new Date(date1), 1), "yyyy-MM-dd") : date1;
    const endDate2 = end1 <= start1 ? format(addDays(new Date(date2), 1), "yyyy-MM-dd") : date2;

    const { error: error1 } = await supabase
        .from("shifts")
        .update({
            start_time: buildTimestamp(date1, start2, tz),
            end_time: buildTimestamp(endDate1, end2, tz),
        })
        .eq("id", shiftId1)
        .eq("organization_id", orgId);

    const { error: error2 } = await supabase
        .from("shifts")
        .update({
            start_time: buildTimestamp(date2, start1, tz),
            end_time: buildTimestamp(endDate2, end1, tz),
        })
        .eq("id", shiftId2)
        .eq("organization_id", orgId);

    if (error1 || error2) {
        return { error: "Could not swap shifts" };
    }

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

    const result = timeOffSchema.safeParse(data);
    if (!result.success) {
        return { error: "Validation failed" };
    }

    const supabase = await createSupabaseServerClient();

    const { employee_id, date, reason } = result.data;

    const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("id")
        .eq("id", employee_id)
        .eq("organization_id", orgId)
        .maybeSingle();

    if (employeeError || !employee) {
        return { error: "Employee not found" };
    }

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
    const { data, error: fetchError } = await supabase
        .from("holidays")
        .select("date")
        .eq("date", dateStr)
        .eq("organization_id", orgId)
        .limit(1)
        .maybeSingle();

    if (fetchError) {
        return { error: "Failed to update holiday" };
    }

    if (data) {
        const { error } = await supabase.from("holidays").delete().eq("date", dateStr).eq("organization_id", orgId);
        if (error) {
            return { error: "Failed to update holiday" };
        }
    } else {
        const { error } = await supabase.from("holidays").insert({ date: dateStr, name: "Holiday", organization_id: orgId });
        if (error) {
            return { error: "Failed to update holiday" };
        }
    }
    updateTag(cacheTags.holidays(orgId));
    revalidatePath("/");
    return { success: true };
}

type StatsResult = {
    byEmployee: Array<{ employee_id: number; name: string; role: string; hours: number; earned: number }>;
    staffTotalEarned: number;
    totalShifts: number;
};

type StatsBreakdown = Array<{ startTs: string; endTs: string; hours: number; earned: number }>;

async function callStatsRpc(orgId: string, start: Date | null, end: Date | null, employeeId?: number): Promise<StatsResult | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_shift_stats", {
        p_org_id: orgId,
        p_start: start ? start.toISOString() : null,
        p_end: end ? end.toISOString() : null,
        p_employee_id: employeeId ?? null,
    });
    if (error || !data || (data as { error?: string }).error) return null;
    return data as StatsResult;
}

async function callBreakdownRpc(orgId: string, start: Date, end: Date, employeeId: number): Promise<StatsBreakdown> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_shift_breakdown", {
        p_org_id: orgId,
        p_start: start.toISOString(),
        p_end: end.toISOString(),
        p_employee_id: employeeId,
    });
    if (error || !data) return [];
    return data as StatsBreakdown;
}

export async function getDetailedStats(period: 'month' | 'all', date: Date) {
    const orgId = await getOrgId();
    const start = period === 'month' ? startOfMonth(date) : null;
    const end = period === 'month' ? endOfMonth(date) : null;
    return callStatsRpc(orgId, start, end);
}

export async function getDetailedStatsByRange(
    startDate: Date,
    endDate: Date,
    employeeId?: string
) {
    const orgId = await getOrgId();
    const empIdNum = employeeId ? Number(employeeId) : undefined;

    const [stats, shifts] = await Promise.all([
        callStatsRpc(orgId, startDate, endDate, empIdNum),
        empIdNum !== undefined
            ? callBreakdownRpc(orgId, startDate, endDate, empIdNum)
            : Promise.resolve<StatsBreakdown | undefined>(undefined),
    ]);
    if (!stats) return null;

    return { ...stats, shifts };
}

export async function getMonthShifts(date: Date) {
    const supabase = await createSupabaseServerClient();
    const orgId = await getOrgId();

    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const { data, error } = await supabase
        .from("shifts")
        .select("id, employee_id, start_time, end_time")
        .eq("organization_id", orgId)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString());

    if (error) {
        return [];
    }
    return data;
}
