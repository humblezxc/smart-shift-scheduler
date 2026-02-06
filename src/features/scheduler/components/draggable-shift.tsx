"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { ShiftCard } from "./shift-card";
import { Shift } from "@/types";
import { cn } from "@/lib/utils";

interface DraggableShiftProps {
    shift: Shift;
    onClick?: () => void;
    isBeingDragged?: boolean;
    disableDroppable?: boolean;
    disabled?: boolean;
}

export function DraggableShift({ shift, onClick, isBeingDragged, disableDroppable, disabled }: DraggableShiftProps) {
    const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
        id: `shift-${shift.id}`,
        data: { shift, type: "shift" },
        disabled,
    });

    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `shift-drop-${shift.id}`,
        data: { shift, type: "shift" },
        disabled: disableDroppable || isDragging || disabled,
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
            {...(disabled ? {} : listeners)}
            {...(disabled ? {} : attributes)}
            onClick={onClick}
            className={cn(
                "transition-all",
                !disabled && "cursor-grab active:cursor-grabbing hover:opacity-90",
                isDragging && "opacity-0",
                isOver && !disableDroppable && "ring-2 ring-blue-400 rounded-lg scale-105"
            )}
        >
            <ShiftCard shift={shift} />
        </div>
    );
}
