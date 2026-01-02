"use client";

import { useState } from "react";
import { format, isSameDay, isSunday } from "date-fns";
import { ShiftCard } from "./shift-card";
import { AddShiftDialog } from "./add-shift-dialog";
import { EditShiftDialog } from "./edit-shift-dialog";
import { Shift, Employee } from "@/types";
import { toggleHoliday } from "../actions";
import { cn } from "@/lib/utils";

interface Props {
    initialShifts: Shift[];
    employees: Employee[];
    days: Date[];
    holidays: any[];
}

export function ScheduleGridClient({ initialShifts, employees, days, holidays }: Props) {
    const [editingShift, setEditingShift] = useState<Shift | null>(null);

    const handleDayClick = async (date: Date) => {
        await toggleHoliday(date);
    };

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <div className="flex gap-4 px-4 py-2 text-xs text-gray-500 bg-gray-50/50 border-b">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-200"></div> Owner</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-200"></div> Manager</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-200"></div> Cashier</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-200"></div> Student</div>
            </div>

            <div className="grid grid-cols-7 border-b bg-gray-50">
                {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const isHoliday = holidays.some(h => h.date === dateStr);
                    const isSun = isSunday(day);
                    const isSpecial = isHoliday || isSun;

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => handleDayClick(day)}
                            title="Click to toggle Holiday status"
                            className={cn(
                                "p-3 text-center border-r last:border-r-0 cursor-pointer transition-colors hover:bg-gray-100",
                                isSpecial && "bg-red-50 hover:bg-red-100 text-red-600"
                            )}
                        >
                            <div className="font-medium text-sm opacity-70">
                                {format(day, "EEE")}
                            </div>
                            <div className={cn("font-bold text-lg", isSpecial && "text-red-700")}>
                                {format(day, "d")}
                            </div>
                            {isHoliday && (
                                <div className="text-[10px] font-bold uppercase tracking-wider text-red-500 mt-1">
                                    Holiday
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-7 min-h-[500px]">
                {days.map((day) => {
                    const dayShifts = initialShifts.filter((shift) =>
                        isSameDay(new Date(shift.start_time), day)
                    );

                    return (
                        <div
                            key={day.toString()}
                            className="p-2 border-r last:border-r-0 flex flex-col bg-white hover:bg-gray-50/30 transition-colors"
                        >
                            <div className="flex-1 space-y-2">
                                {dayShifts.map((shift) => (
                                    <div
                                        key={shift.id}
                                        onClick={() => setEditingShift(shift)}
                                        className="cursor-pointer transition-transform active:scale-95 hover:opacity-90"
                                    >
                                        <ShiftCard shift={shift} />
                                    </div>
                                ))}
                            </div>

                            <AddShiftDialog date={day} employees={employees} />
                        </div>
                    );
                })}
            </div>

            {editingShift && (
                <EditShiftDialog
                    shift={editingShift}
                    employees={employees}
                    open={!!editingShift}
                    onOpenChange={(open) => !open && setEditingShift(null)}
                />
            )}
        </div>
    );
}