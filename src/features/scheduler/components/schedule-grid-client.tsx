"use client";

import { useState, useId, useEffect } from "react";
import { format, isSameDay, isSunday, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    useDroppable,
    useDraggable,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from "@dnd-kit/core";
import { ShiftCard } from "./shift-card";
import { AddShiftDialog } from "./add-shift-dialog";
import { EditShiftDialog } from "./edit-shift-dialog";
import { Shift, Employee } from "@/types";
import { toggleHoliday, moveShiftToDate, swapShiftTimes } from "../actions";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: { active: { opacity: "0.5" } },
    }),
};

function DraggableShift({ shift, onClick, isBeingDragged, disableDroppable }: { shift: Shift; onClick: () => void; isBeingDragged?: boolean; disableDroppable?: boolean }) {
    const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
        id: `shift-${shift.id}`,
        data: { shift, type: "shift" },
    });

    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `shift-drop-${shift.id}`,
        data: { shift, type: "shift" },
        disabled: disableDroppable || isDragging,
    });

    if (isBeingDragged) {
        return <div className="h-0 overflow-hidden" />;
    }

    return (
        <div
            ref={(node) => {
                setDraggableRef(node);
                setDroppableRef(node);
            }}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={cn(
                "cursor-grab active:cursor-grabbing hover:opacity-90 transition-all",
                isDragging && "opacity-0",
                isOver && !disableDroppable && "ring-2 ring-blue-400 rounded-lg scale-105"
            )}
        >
            <ShiftCard shift={shift} />
        </div>
    );
}

function DroppableDay({ day, children, isOver }: { day: Date; children: React.ReactNode; isOver?: boolean }) {
    const dateStr = format(day, "yyyy-MM-dd");
    const { setNodeRef, isOver: isCurrentlyOver } = useDroppable({
        id: `day-${dateStr}`,
        data: { date: dateStr },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "p-2 border-r last:border-r-0 flex flex-col bg-white transition-colors min-h-[500px]",
                (isOver || isCurrentlyOver) && "bg-blue-50 ring-2 ring-blue-300 ring-inset"
            )}
        >
            {children}
        </div>
    );
}

interface Props {
    initialShifts: Shift[];
    employees: Employee[];
    days: Date[];
    holidays: any[];
}

export function ScheduleGridClient({ initialShifts, employees, days, holidays }: Props) {
    const [shifts, setShifts] = useState<Shift[]>(initialShifts);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const { t } = useLanguage();
    const router = useRouter();
    const dndContextId = useId();

    useEffect(() => {
        setShifts(initialShifts);
    }, [initialShifts]);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 5 },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const shift = event.active.data.current?.shift as Shift;
        if (shift) {
            setActiveShift(shift);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveShift(null);
            return;
        }

        const draggedShift = active.data.current?.shift as Shift;
        const overType = over.data.current?.type as string | undefined;
        const targetShift = over.data.current?.shift as Shift | undefined;
        const targetDate = over.data.current?.date as string | undefined;

        if (!draggedShift) {
            setActiveShift(null);
            return;
        }

        if (overType === "shift" && targetShift && targetShift.id !== draggedShift.id) {
            const draggedDate = format(new Date(draggedShift.start_time), "yyyy-MM-dd");
            const targetDateStr = format(new Date(targetShift.start_time), "yyyy-MM-dd");

            if (draggedDate === targetDateStr) {
                const draggedStartTime = format(new Date(draggedShift.start_time), "HH:mm");
                const draggedEndTime = format(new Date(draggedShift.end_time), "HH:mm");
                const targetStartTime = format(new Date(targetShift.start_time), "HH:mm");
                const targetEndTime = format(new Date(targetShift.end_time), "HH:mm");

                setShifts((prev) =>
                    prev.map((s) => {
                        if (s.id === draggedShift.id) {
                            return {
                                ...s,
                                start_time: `${draggedDate}T${targetStartTime}:00`,
                                end_time: `${draggedDate}T${targetEndTime}:00`,
                            };
                        }
                        if (s.id === targetShift.id) {
                            return {
                                ...s,
                                start_time: `${targetDateStr}T${draggedStartTime}:00`,
                                end_time: `${targetDateStr}T${draggedEndTime}:00`,
                            };
                        }
                        return s;
                    })
                );

                setTimeout(() => setActiveShift(null), 250);

                const result = await swapShiftTimes(draggedShift.id, targetShift.id);
                if (result.error) {
                    setShifts(initialShifts);
                }
                return;
            }
        }

        if (!targetDate) {
            setActiveShift(null);
            return;
        }

        const currentDate = format(new Date(draggedShift.start_time), "yyyy-MM-dd");
        if (currentDate === targetDate) {
            setActiveShift(null);
            return;
        }

        const oldStart = new Date(draggedShift.start_time);
        const oldEnd = new Date(draggedShift.end_time);
        const startTime = format(oldStart, "HH:mm");
        const endTime = format(oldEnd, "HH:mm");

        setShifts((prev) =>
            prev.map((s) =>
                s.id === draggedShift.id
                    ? {
                          ...s,
                          start_time: `${targetDate}T${startTime}:00`,
                          end_time: `${targetDate}T${endTime}:00`,
                      }
                    : s
            )
        );

        setTimeout(() => setActiveShift(null), 250);

        const result = await moveShiftToDate(draggedShift.id, targetDate);
        if (result.error) {
            setShifts(initialShifts);
        }
    };

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