import { Shift } from "@/types";

export function calculateTotalHours(shifts: Shift[]): number {
    return shifts.reduce((acc, s) => {
        const start = new Date(s.start_time);
        const end = new Date(s.end_time);
        return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
}