"use client";

import { useState, useCallback } from "react";
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { format } from "date-fns";
import { Shift } from "@/types";
import { moveShiftToDate, swapShiftTimes } from "../actions";

interface UseShiftDragOptions {
    initialShifts: Shift[];
    onShiftsChange: (shifts: Shift[]) => void;
}

export function useShiftDrag({ initialShifts, onShiftsChange }: UseShiftDragOptions) {
    const [activeShift, setActiveShift] = useState<Shift | null>(null);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const shift = event.active.data.current?.shift as Shift;
        if (shift) {
            setActiveShift(shift);
        }
    }, []);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
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

        // Swap times when dropping on another shift on the same day
        if (overType === "shift" && targetShift && targetShift.id !== draggedShift.id) {
            const draggedDate = format(new Date(draggedShift.start_time), "yyyy-MM-dd");
            const targetDateStr = format(new Date(targetShift.start_time), "yyyy-MM-dd");

            if (draggedDate === targetDateStr) {
                const draggedStartTime = format(new Date(draggedShift.start_time), "HH:mm");
                const draggedEndTime = format(new Date(draggedShift.end_time), "HH:mm");
                const targetStartTime = format(new Date(targetShift.start_time), "HH:mm");
                const targetEndTime = format(new Date(targetShift.end_time), "HH:mm");

                // Optimistic update
                onShiftsChange(
                    initialShifts.map((s) => {
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
                    onShiftsChange(initialShifts);
                }
                return;
            }
        }

        // Move to different day
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

        // Optimistic update
        onShiftsChange(
            initialShifts.map((s) =>
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
            onShiftsChange(initialShifts);
        }
    }, [initialShifts, onShiftsChange]);

    return {
        activeShift,
        handleDragStart,
        handleDragEnd,
    };
}
