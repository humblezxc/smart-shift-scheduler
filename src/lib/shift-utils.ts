import { Shift } from "@/types";

export function calculateTotalHours(shifts: Shift[]): number {
    return shifts.reduce((acc, s) => {
        const start = new Date(s.start_time);
        const end = new Date(s.end_time);
        return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
}

export function computeWeekStats(
    shifts: Array<{ start_time: string; end_time: string; hourly_rate?: number | null }>
) {
    let totalHours = 0;
    let totalCost = 0;
    for (const s of shifts) {
        const hours = (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 3_600_000;
        const rate = s.hourly_rate ?? 0;
        totalHours += hours;
        totalCost += hours * rate;
    }
    return {
        totalShifts: shifts.length,
        totalHours: Math.round(totalHours * 10) / 10,
        totalCost: Math.round(totalCost),
    };
}