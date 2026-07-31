import { memo } from "react";
import { Shift } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { resolveEmployeeColor } from "@/lib/employee-colors";

interface Props {
    shift: Shift;
}

export const ShiftCard = memo(function ShiftCard({ shift }: Props) {
    const role = shift.employee?.role || "cashier";
    const colors = resolveEmployeeColor({ color: shift.employee?.color, role });

    return (
        <div
            className={cn(
                "p-2 rounded-md border border-l-4 text-xs font-medium shadow-sm transition-all mb-2",
                colors.card,
                colors.accent
            )}
        >
            <div className="flex justify-between items-center mb-1">
                <span className="font-bold truncate">
                    {shift.employee?.first_name} {shift.employee?.last_name?.charAt(0)}.
                </span>
                <span className="opacity-75 text-[10px] uppercase">{role}</span>
            </div>
            <div className="flex items-center gap-1 opacity-90">
                <ClockIcon className="w-3 h-3" />
                <span>{format(new Date(shift.start_time), "HH:mm")} - {format(new Date(shift.end_time), "HH:mm")}</span>
            </div>
        </div>
    );
});

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}