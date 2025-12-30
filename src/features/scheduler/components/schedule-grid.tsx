import { format, isSameDay } from "date-fns";
import { getShiftsForWeek } from "../actions";
import { getWeekDays, getWeekRange } from "@/lib/date-utils";
import { ShiftCard } from "./shift-card";
import { Shift } from "@/types";

export async function ScheduleGrid() {
    const today = new Date();
    const { start, end } = getWeekRange(today);

    const days = getWeekDays(start);

    // @ts-ignore
    const shifts: Shift[] = await getShiftsForWeek(start, end);

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <div className="grid grid-cols-7 border-b bg-gray-50">
                {days.map((day) => (
                    <div key={day.toString()} className="p-3 text-center border-r last:border-r-0">
                        <div className="font-medium text-sm text-gray-500">
                            {format(day, "EEE")}
                        </div>
                        <div className="font-bold text-lg">
                            {format(day, "d")}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 min-h-[500px]">
                {days.map((day) => {
                    const dayShifts = shifts.filter((shift) =>
                        isSameDay(new Date(shift.start_time), day)
                    );

                    return (
                        <div key={day.toString()} className="p-2 border-r last:border-r-0 bg-white hover:bg-gray-50/50 transition-colors">
                            {dayShifts.map((shift) => (
                                <ShiftCard key={shift.id} shift={shift} />
                            ))}

                            {dayShifts.length === 0 && (
                                <div className="h-full flex items-center justify-center text-gray-300 text-xs italic">
                                    No shifts
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}