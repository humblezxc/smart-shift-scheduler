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
                "p-2 border-r last:border-r-0 flex flex-col bg-white transition-colors min-h-[500px]",
                isOver && "bg-blue-50 ring-2 ring-blue-300 ring-inset"
            )}
        >
            {children}
        </div>
    );
}
