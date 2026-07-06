import { memo } from "react";
import { Shift } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
    shift: Shift;
}

const roleColors: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-950/80",
    manager: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-950/80",
    cashier: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-950/80",
    student: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-950/80",
};

export const ShiftCard = memo(function ShiftCard({ shift }: Props) {
    const role = shift.employee?.role || "cashier";

    const colorClass = roleColors[role] || "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";

    return (
        <div className={cn("p-2 rounded-md border text-xs font-medium shadow-sm transition-all mb-2", colorClass)}>
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