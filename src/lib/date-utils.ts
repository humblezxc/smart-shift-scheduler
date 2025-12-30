import { startOfWeek, endOfWeek, addDays, format } from "date-fns";

export const WEEK_STARTS_ON = 1;

export function getWeekRange(date: Date) {
    const start = startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(date, { weekStartsOn: WEEK_STARTS_ON });
    return { start, end };
}

export function getWeekDays(startDate: Date) {
    return Array.from({ length: 7 }).map((_, index) => {
        return addDays(startDate, index);
    });
}