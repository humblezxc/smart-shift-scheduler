"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { createPublicTimeOffRequest } from "@/features/employees/actions";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/context/language-context";

export function RequestTimeOff({ shareToken, label }: { employeeId?: number; shareToken?: string; label?: string }) {
    const [date, setDate] = useState<Date>();
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const { t } = useLanguage();

    async function handleRequest() {
        if (!date || !shareToken) return;
        setLoading(true);

        const trimmed = note.trim();
        const res = await createPublicTimeOffRequest({
            share_token: shareToken,
            date: format(date, "yyyy-MM-dd"),
            reason: trimmed ? `Day off: ${trimmed}` : "Requested via share link",
        });

        setLoading(false);

        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(`${t("employee.request_sent")} ${format(date, "MMM d")}`);
            setOpen(false);
            setDate(undefined);
            setNote("");
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="destructive" className="w-full sm:w-auto">
                    <Ban className="mr-2 h-4 w-4" />
                    {label || t("employee.cant_work")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 border-b bg-muted text-sm font-medium text-center">
                    {t("employee.select_date")}
                </div>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                />
                <div className="p-3 space-y-2">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t("employee.note_placeholder")}
                        maxLength={200}
                        rows={2}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button
                        className="w-full"
                        disabled={!date || loading}
                        onClick={handleRequest}
                        variant="destructive"
                    >
                        {loading ? t("common.saving") : t("employee.confirm_request")}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
