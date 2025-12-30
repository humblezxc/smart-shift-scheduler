import { format, isSameDay } from "date-fns";
import { getShiftsForWeek } from "../actions";
import { getWeekDays, getWeekRange } from "@/lib/date-utils";
import { ShiftCard } from "./shift-card";
import { Shift, Employee } from "@/types";
import { AddShiftDialog } from "./add-shift-dialog";
import { supabase } from "@/lib/supabase";

export async function ScheduleGrid() {
    const today = new Date();
    const { start, end } = getWeekRange(today);
    const days = getWeekDays(start);

    const [shiftsData, employeesData] = await Promise.all([
        getShiftsForWeek(start, end),
        supabase.from("employees").select("*").order("first_name"),
    ]);

    // @ts-ignore
    const shifts: Shift[] = shiftsData || [];
    const employees: Employee[] = (employeesData.data as Employee[]) || [];

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
                        <div key={day.toString()} className="p-2 border-r last:border-r-0 flex flex-col bg-white hover:bg-gray-50/30 transition-colors">
                            <div className="flex-1">
                                {dayShifts.map((shift) => (
                                    <ShiftCard key={shift.id} shift={shift} />
                                ))}
                            </div>

                            <AddShiftDialog date={day} employees={employees} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}