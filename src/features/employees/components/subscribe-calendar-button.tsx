"use client";

import { useState } from "react";
import { CalendarPlus, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";

interface Props {
    shareToken: string;
}

export function SubscribeCalendarButton({ shareToken }: Props) {
    const { t, language } = useLanguage();
    const [copied, setCopied] = useState(false);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const feedUrl = `${origin}/s/${shareToken}/calendar.ics?lang=${language}`;
    const webcalUrl = feedUrl.replace(/^https?:/, "webcal:");
    const googleUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`;

    async function copyFeed() {
        await navigator.clipboard.writeText(feedUrl);
        setCopied(true);
        toast.success(t("employee.feed_copied"));
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="space-y-1.5">
            <div className="flex gap-2">
                <Button className="flex-1" asChild>
                    <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                        <CalendarPlus className="w-4 h-4 mr-2" />
                        {t("employee.subscribe_calendar")}
                    </a>
                </Button>
                <Button variant="outline" size="icon" onClick={copyFeed} title={t("employee.copy_feed")}>
                    {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">{t("employee.calendar_hint")}</p>
        </div>
    );
}
