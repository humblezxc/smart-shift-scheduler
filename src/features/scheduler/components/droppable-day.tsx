"use client";

import { useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DroppableDayProps {
    day: Date;
    children: React.ReactNode;
}

export function DroppableDay({ day, children }: DroppableDayProps) {
    const dateStr = format(day, "yyyy-MM-dd");
    const { setNodeRef, isOver } = useDroppable({
        id: `day-${dateStr}`,
        data: { date: dateStr },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "p-2 border-r last:border-r-0 flex flex-col bg-card transition-colors min-h-[500px]",
                isOver && "bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-300 dark:ring-blue-700 ring-inset"
            )}
        >
            {children}
        </div>
    );
}
