import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { supabase } from "@/lib/supabase";
import { getDayTask, DAY_TASK_EMOJI } from "@/features/scheduler/lib/day-task";
import { translations, Language } from "@/lib/translations";

interface ResolveResult {
    success?: boolean;
    employee_id?: number;
    first_name?: string;
    last_name?: string;
    timezone?: string;
}

interface ShiftsResult {
    success?: boolean;
    shifts?: Array<{ id: number; start_time: string; end_time: string }>;
}

function icsEscape(text: string): string {
    return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function icsUtc(iso: string | Date): string {
    return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const langParam = request.nextUrl.searchParams.get("lang");
    const lang: Language = langParam === "pl" || langParam === "uk" ? langParam : "en";
    const dict = translations[lang];

    const { data: resolveData, error: resolveError } = await supabase
        .rpc("resolve_share_token", { p_token: token })
        .single<ResolveResult>();

    if (resolveError) {
        return new NextResponse(null, { status: 503 });
    }
    if (!resolveData?.success || !resolveData.employee_id) {
        return new NextResponse(null, { status: 404 });
    }

    const from = addDays(new Date(), -7);
    const to = addDays(new Date(), 90);

    const { data: shiftsData, error: shiftsError } = await supabase
        .rpc("get_shifts_by_share_token", {
            p_token: token,
            p_from: from.toISOString(),
            p_to: to.toISOString(),
        })
        .single<ShiftsResult>();

    if (shiftsError) {
        return new NextResponse(null, { status: 503 });
    }

    const tz = resolveData.timezone || "Europe/Warsaw";
    const shiftWord = dict.employee.shift_word;
    const calName = `${dict.employee.calendar_name} — ${resolveData.first_name || ""}`.trim();
    const host = request.nextUrl.host || "smart-shift-scheduler";
    const dtstamp = icsUtc(new Date());

    const lines: string[] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Smart Shift Scheduler//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        `X-WR-CALNAME:${icsEscape(calName)}`,
        "X-PUBLISHED-TTL:PT12H",
        "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
    ];

    for (const shift of shiftsData?.shifts || []) {
        const startLabel = formatInTimeZone(new Date(shift.start_time), tz, "HH:mm");
        const endLabel = formatInTimeZone(new Date(shift.end_time), tz, "HH:mm");
        const zonedStart = toZonedTime(new Date(shift.start_time), tz);
        const task = getDayTask(zonedStart);
        const taskLabel = dict.dayTask[task];
        const summary = `${shiftWord} ${startLabel}–${endLabel} · ${DAY_TASK_EMOJI[task]} ${taskLabel}`;

        lines.push(
            "BEGIN:VEVENT",
            `UID:shift-${shift.id}@${host}`,
            `DTSTAMP:${dtstamp}`,
            `DTSTART:${icsUtc(shift.start_time)}`,
            `DTEND:${icsUtc(shift.end_time)}`,
            `SUMMARY:${icsEscape(summary)}`,
            "END:VEVENT"
        );
    }

    lines.push("END:VCALENDAR");

    return new NextResponse(lines.join("\r\n") + "\r\n", {
        status: 200,
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'inline; filename="schedule.ics"',
            "Cache-Control": "public, max-age=0, s-maxage=3600",
        },
    });
}
