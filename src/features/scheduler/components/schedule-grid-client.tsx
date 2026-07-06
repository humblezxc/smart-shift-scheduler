"use client";

import { useState, useId, useEffect, useMemo } from "react";
import { format, isSunday } from "date-fns";
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
import { DayTaskTag } from "./day-task-tag";
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
    canManage?: boolean;
}

export function ScheduleGridClient({ initialShifts, employees, days, holidays, canManage = false }: Props) {
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

    const shiftsByDay = useMemo(() => {
        const map = new Map<string, Shift[]>();
        for (const shift of shifts) {
            const key = format(new Date(shift.start_time), "yyyy-MM-dd");
            const list = map.get(key);
            if (list) {
                list.push(shift);
            } else {
                map.set(key, [shift]);
            }
        }
        for (const list of map.values()) {
            list.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        }
        return map;
    }, [shifts]);

    const handleDayClick = async (date: Date) => {
        if (!canManage) return;
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
        <div className="border rounded-lg bg-card overflow-hidden">
            <div className="flex gap-4 px-4 py-2 text-xs text-muted-foreground bg-muted/50 border-b overflow-x-auto">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-purple-200 dark:bg-purple-800"></div> {t("roles.owner")}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-200 dark:bg-amber-800"></div> {t("roles.manager")}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-200 dark:bg-blue-800"></div> {t("roles.cashier")}</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-200 dark:bg-emerald-800"></div> {t("roles.student")}</div>
            </div>

            <div className="grid grid-cols-7 border-b bg-muted">
                {days.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const hasHolidayRecord = holidays.some(h => h.date === dateStr);
                    const isSun = isSunday(day);
                    const isSpecial = isSun ? !hasHolidayRecord : hasHolidayRecord;

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => handleDayClick(day)}
                            title={canManage ? (isSpecial ? "Click to make working day" : "Click to make holiday") : undefined}
                            className={cn(
                                "p-3 text-center border-r last:border-r-0 transition-colors",
                                canManage && "cursor-pointer hover:bg-accent",
                                isSpecial && "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400",
                                isSpecial && canManage && "hover:bg-red-100 dark:hover:bg-red-950/60"
                            )}
                        >
                            <div className="font-medium text-sm opacity-70">
                                {getTranslatedDay(day)}
                            </div>
                            <div className={cn("font-bold text-lg", isSpecial && "text-red-700 dark:text-red-400")}>
                                {format(day, "d")}
                            </div>

                            {isSpecial && (
                                <div className="text-[10px] font-bold uppercase tracking-wider text-red-500 mt-1">
                                    {t("scheduler.holiday")}
                                </div>
                            )}

                            <DayTaskTag date={day} className="mt-1.5" />
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
                        const dayShifts = shiftsByDay.get(format(day, "yyyy-MM-dd")) ?? [];

                        return (
                            <DroppableDay key={day.toString()} day={day}>
                                <div className="flex-1 space-y-2">
                                    {dayShifts.map((shift) => (
                                        <DraggableShift
                                            key={shift.id}
                                            shift={shift}
                                            onEdit={canManage ? setEditingShift : undefined}
                                            isBeingDragged={activeShift?.id === shift.id}
                                            disableDroppable={activeShift?.id === shift.id || !canManage}
                                            disabled={!canManage}
                                        />
                                    ))}
                                </div>

                                {canManage && <AddShiftDialog date={day} employees={employees} />}
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
