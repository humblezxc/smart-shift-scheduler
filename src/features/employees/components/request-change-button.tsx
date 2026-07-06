"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MessageSquareShare } from "lucide-react";
import { toast } from "sonner";
import { createPublicTimeOffRequest } from "@/features/employees/actions";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/context/language-context";

interface Props {
    date: Date;
    startLabel: string;
    endLabel: string;
    shareToken?: string;
}

export function RequestChangeButton({ date, startLabel, endLabel, shareToken }: Props) {
    const [open, setOpen] = useState(false);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    async function handleSend() {
        if (!shareToken) return;
        setLoading(true);
        const trimmed = note.trim();
        const res = await createPublicTimeOffRequest({
            share_token: shareToken,
            date: format(date, "yyyy-MM-dd"),
            reason: `Shift change (${startLabel}–${endLabel})${trimmed ? `: ${trimmed}` : ""}`,
        });
        setLoading(false);

        if (res.error) {
            toast.error(res.error);
            return;
        }
        toast.success(t("employee.change_requested"));
        setOpen(false);
        setNote("");
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <MessageSquareShare className="w-3.5 h-3.5 mr-1.5" />
                    {t("employee.request_change")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t("employee.request_change")}</DialogTitle>
                    <DialogDescription>
                        {format(date, "yyyy-MM-dd")} · {startLabel} – {endLabel}
                        <br />
                        {t("employee.request_change_desc")}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="change-note">
                        {t("employee.note_label")}
                    </label>
                    <textarea
                        id="change-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t("employee.note_placeholder")}
                        maxLength={200}
                        rows={3}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <DialogFooter>
                    <Button className="w-full" onClick={handleSend} disabled={loading}>
                        {loading ? t("common.saving") : t("employee.send_request")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
