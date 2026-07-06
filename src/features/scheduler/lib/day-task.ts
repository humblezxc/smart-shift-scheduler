export type DayTask = "pallet" | "fridge";

const PALLET_WEEKDAYS = new Set([2, 4, 6]);

export function getDayTask(date: Date): DayTask {
    return PALLET_WEEKDAYS.has(date.getDay()) ? "pallet" : "fridge";
}

export const DAY_TASK_EMOJI: Record<DayTask, string> = {
    pallet: "📦",
    fridge: "❄️",
};
