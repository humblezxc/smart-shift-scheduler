"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WEEK_STARTS_ON } from "@/lib/date-utils";

export function WeekNavigation() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const dateParam = searchParams.get("date");
    const currentDate = dateParam ? new Date(dateParam) : new Date();

    const start = startOfWeek(currentDate, { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(currentDate, { weekStartsOn: WEEK_STARTS_ON });

    const handleNavigate = (newDate: Date) => {
        const dateString = format(newDate, "yyyy-MM-dd");
        router.push(`/?date=${dateString}`);
    };

    return (
        <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleNavigate(subWeeks(currentDate, 1))}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleNavigate(addWeeks(currentDate, 1))}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => handleNavigate(new Date())}
                    className="text-sm"
                >
                    Today
                </Button>
            </div>

            <div className="flex items-center gap-2 font-medium text-lg">
                <CalendarIcon className="h-5 w-5 text-gray-500" />
                <span>
          {format(start, "MMM d")} - {format(end, "MMM d, yyyy")}
        </span>
            </div>
        </div>
    );
}