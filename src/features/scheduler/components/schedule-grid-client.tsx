"use client";

import { useState, useId, useEffect } from "react";
import { format, isSameDay, isSunday } from "date-fns";
import { useRouter } from "next/navigation";
import {
    DndContext,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from "@dnd-kit/core";
import { ShiftCard } from "./shift-card";
import { AddShiftDialog } from "./add-shift-dialog";
import { EditShiftDialog } from "./edit-shift-dialog";
import { DraggableShift } from "./draggable-shift";
import { DroppableDay } from "./droppable-day";
import { useShiftDrag } from "../hooks/use-shift-drag";
import { Shift, Employee } from "@/types";
import { toggleHoliday } from "../actions";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: { active: { opacity: "0.5" } },
    }),
};

interface Props {
    initialShifts: Shift[];
    employees: Employee[];
    days: Date[];
    holidays: any[];
}

export function ScheduleGridClient({ initialShifts, employees, days, holidays }: Props) {
    const [shifts, setShifts] = useState<Shift[]>(initialShifts);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const { t } = useLanguage();
    const router = useRouter();
    const dndContextId = useId();

    useEffect(() => {
        setShifts(initialShifts);
    }, [initialShifts]);

    const { activeShift, handleDragStart, handleDragEnd } = useShiftDrag({
        initialShifts: shifts,
        onShiftsChange: setShifts,
    });

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 5 },
        })
    );

    const handleDayClick = async (date: Date) => {
        await toggleHoliday(date);
        router.refresh();
    };

    const getTranslatedDay = (date: Date) => {
        const englishDay = format(date, "EEEE");
        const translated = t(`employee.${englishDay}`);
        return translated && translated !== `employee.${englishDay}`
            ? translated.substring(0, 3)
            : englishDay.substring(0, 3);
    };

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <div className="flex gap-4 px-4 py-2 text-xs text-gray-500 bg-gray-50/50 border-b overflow-x-auto">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-200"></div> {t("roles.owner")}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-200"></div> {t("roles.manager")}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-200"></div> {t("roles.cashier")}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-200"></div> {t("roles.student")}</div>
            </div>

            <div className="grid grid-cols-7 border-b bg-gray-50">
                {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const hasHolidayRecord = holidays.some(h => h.date === dateStr);
                    const isSun = isSunday(day);
                    const isSpecial = isSun ? !hasHolidayRecord : hasHolidayRecord;

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => handleDayClick(day)}
                            title={isSpecial ? "Click to make working day" : "Click to make holiday"}
                            className={cn(
                                "p-3 text-center border-r last:border-r-0 cursor-pointer transition-colors hover:bg-gray-100",
                                isSpecial && "bg-red-50 hover:bg-red-100 text-red-600"
                            )}
                        >
                            <div className="font-medium text-sm opacity-70">
                                {getTranslatedDay(day)}
                            </div>
                            <div className={cn("font-bold text-lg", isSpecial && "text-red-700")}>
                                {format(day, "d")}
                            </div>

                            {isSpecial && (
                                <div className="text-[10px] font-bold uppercase tracking-wider text-red-500 mt-1">
                                    {t("scheduler.holiday")}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <DndContext
                id={dndContextId}
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-7">
                    {days.map((day) => {
                        const dayShifts = shifts
                            .filter((shift) => isSameDay(new Date(shift.start_time), day))
                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                        return (
                            <DroppableDay key={day.toString()} day={day}>
                                <div className="flex-1 space-y-2">
                                    {dayShifts.map((shift) => (
                                        <DraggableShift
                                            key={shift.id}
                                            shift={shift}
                                            onClick={() => setEditingShift(shift)}
                                            isBeingDragged={activeShift?.id === shift.id}
                                            disableDroppable={activeShift?.id === shift.id}
                                        />
                                    ))}
                                </div>

                                <AddShiftDialog date={day} employees={employees} />
                            </DroppableDay>
                        );
                    })}
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeShift && (
                        <div className="shadow-lg rounded-lg scale-105">
                            <ShiftCard shift={activeShift} />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

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
