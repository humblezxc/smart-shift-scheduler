"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {useLanguage} from "@/context/language-context";

interface WeekNavigationProps {
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export function WeekNavigation({ weekStartsOn }: WeekNavigationProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();

    const dateParam = searchParams.get("date");
    const currentDate = dateParam ? new Date(dateParam) : new Date();

    const start = startOfWeek(currentDate, { weekStartsOn });
    const end = endOfWeek(currentDate, { weekStartsOn });

    const handleNavigate = (newDate: Date) => {
        const dateString = format(newDate, "yyyy-MM-dd");
        router.push(`/?date=${dateString}`);
    };

    return (
        <div className="flex items-center justify-between mb-4 bg-card p-3 rounded-lg border shadow-sm">
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
                    {t('common.today')}
                </Button>
            </div>

            <div className="flex items-center gap-2 font-medium text-lg">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <span>
          {format(start, "MMM d")} - {format(end, "MMM d, yyyy")}
        </span>
            </div>
        </div>
    );
}