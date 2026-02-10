"use client";

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

    return (
        <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
                if (newDate) {
                    router.push(`/?date=${format(newDate, "yyyy-MM-dd")}`);
                }
            }}
            weekStartsOn={weekStartsOn}
            className="rounded-md border mx-auto"
        />
    );
}