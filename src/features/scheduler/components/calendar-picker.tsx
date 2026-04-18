"use client";

import { useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

interface CalendarPickerProps {
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export function CalendarPicker({ weekStartsOn }: CalendarPickerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const dateParam = searchParams.get("date");
    const date = dateParam ? new Date(dateParam) : new Date();

    const lastPrefetchRef = useRef<string | null>(null);

    const prefetchDate = useCallback((day: Date) => {
        const key = format(day, "yyyy-MM-dd");
        if (lastPrefetchRef.current === key) return;
        lastPrefetchRef.current = key;
        router.prefetch(`/?date=${key}`);
    }, [router]);

    return (
        <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
                if (newDate) {
                    router.push(`/?date=${format(newDate, "yyyy-MM-dd")}`);
                }
            }}
            onDayMouseEnter={prefetchDate}
            onDayFocus={prefetchDate}
            weekStartsOn={weekStartsOn}
            className="rounded-md border mx-auto"
        />
    );
}
