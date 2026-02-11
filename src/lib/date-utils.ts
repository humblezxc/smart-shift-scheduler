import { startOfWeek, endOfWeek, addDays, format } from "date-fns";

export function getWeekRange(date: Date, weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 1) {
    const start = startOfWeek(date, { weekStartsOn });
    const end = endOfWeek(date, { weekStartsOn });
    return { start, end };
}

export function getWeekDays(startDate: Date) {
    return Array.from({ length: 7 }).map((_, index) => {
        return addDays(startDate, index);
    });
}