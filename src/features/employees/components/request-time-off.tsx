"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Ban } from "lucide-react";
import { toast } from "sonner";
import { createTimeOffRequest } from "@/features/scheduler/actions";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function RequestTimeOff({ employeeId }: { employeeId: number }) {
    const [date, setDate] = useState<Date>();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    async function handleRequest() {
        if (!date) return;
        setLoading(true);

        const res = await createTimeOffRequest({
            employee_id: employeeId,
            date: date,
            reason: "Requested via link",
        });

        setLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(`Time off requested for ${format(date, "MMM d")}`);
            setOpen(false);
            setDate(undefined);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                    <Ban className="mr-2 h-4 w-4" />
                    I can't work...
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b bg-gray-50 text-sm font-medium text-center">
                    Select a date you are unavailable
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                />
                <div className="p-3">
                    <Button
                        className="w-full"
                        disabled={!date || loading}
                        onClick={handleRequest}
                        variant="destructive"
                    >
                        {loading ? "Sending..." : "Confirm Request"}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}