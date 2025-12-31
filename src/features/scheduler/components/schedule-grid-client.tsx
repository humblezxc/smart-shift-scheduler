"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { ShiftCard } from "./shift-card";
import { AddShiftDialog } from "./add-shift-dialog";
import { EditShiftDialog } from "./edit-shift-dialog";
import { Shift, Employee } from "@/types";

interface Props {
    initialShifts: Shift[];
    employees: Employee[];
    days: Date[];
}

export function ScheduleGridClient({ initialShifts, employees, days }: Props) {
    const [editingShift, setEditingShift] = useState<Shift | null>(null);

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