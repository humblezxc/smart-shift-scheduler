"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

export function CalendarPicker() {
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
            className="rounded-md border mx-auto"
        />
    );
}