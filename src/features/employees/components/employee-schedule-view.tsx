"use client";

import { useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, isSameDay, addDays } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { CalendarPlus, Clock, Calendar as CalendarIcon, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestTimeOff } from "@/features/employees/components/request-time-off";
import { RejectShiftButton } from "@/features/employees/components/reject-shift-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { DayTaskTag } from "@/features/scheduler/components/day-task-tag";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";

interface ShiftRecord {
    id: number | string;
    start_time: string;
    end_time: string;
}

interface EmployeeRecord {
    id: number;
    first_name: string;
    last_name: string;
    role: string;
}

interface Props {
    employee: EmployeeRecord;
    shifts: ShiftRecord[];
    shareToken?: string;
    timezone: string;
}

const ROLE_STYLES: Record<string, string> = {
    owner: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-200",
    manager: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
    cashier: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
    student: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
};

function googleCalendarLink(shift: ShiftRecord, employeeName: string) {
    const start = new Date(shift.start_time).toISOString().replace(/-|:|\.\d{3}/g, "");
    const end = new Date(shift.end_time).toISOString().replace(/-|:|\.\d{3}/g, "");
    const text = encodeURIComponent(`Shift: ${employeeName}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}`;
}

function durationHours(shift: ShiftRecord): number {
    return (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3_600_000;
}

export function EmployeeScheduleView({ employee, shifts, shareToken, timezone }: Props) {
    const { t } = useLanguage();
    const [selectedFilter, setSelectedFilter] = useState<"all" | "thisWeek" | "nextWeek">("all");

    const tz = timezone || "Europe/Warsaw";
    const employeeName = `${employee.first_name} ${employee.last_name}`.trim();

    const fmt = (d: Date, pattern: string) => formatInTimeZone(d, tz, pattern);
    const localDate = (iso: string) => toZonedTime(new Date(iso), tz);

    const { groups, totalHours, thisWeekHours, nextWeekHours } = useMemo(() => {
        const nowLocal = toZonedTime(new Date(), tz);
        const thisWeekStart = startOfWeek(nowLocal, { weekStartsOn: 1 });
        const thisWeekEnd = endOfWeek(nowLocal, { weekStartsOn: 1 });
        const nextWeekStart = addDays(thisWeekStart, 7);
        const nextWeekEnd = addDays(thisWeekEnd, 7);

        let total = 0;
        let thisWk = 0;
        let nextWk = 0;

        const groupedMap: Record<string, { label: string; key: string; shifts: ShiftRecord[]; hours: number; isThisWeek: boolean; isNextWeek: boolean; }> = {};

        for (const s of shifts) {
            const d = localDate(s.start_time);
            const hours = durationHours(s);
            total += hours;

            const inThisWeek = d >= thisWeekStart && d <= thisWeekEnd;
            const inNextWeek = d >= nextWeekStart && d <= nextWeekEnd;

            if (inThisWeek) thisWk += hours;
            if (inNextWeek) nextWk += hours;

            if (selectedFilter === "thisWeek" && !inThisWeek) continue;
            if (selectedFilter === "nextWeek" && !inNextWeek) continue;

            const weekKey = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
            if (!groupedMap[weekKey]) {
                const ws = startOfWeek(d, { weekStartsOn: 1 });
                const we = endOfWeek(d, { weekStartsOn: 1 });
                groupedMap[weekKey] = {
                    key: weekKey,
                    label: `${format(ws, "MMM d")} – ${format(we, "MMM d")}`,
                    shifts: [],
                    hours: 0,
                    isThisWeek: inThisWeek,
                    isNextWeek: inNextWeek,
                };
            }
            groupedMap[weekKey].shifts.push(s);
            groupedMap[weekKey].hours += hours;
        }

        const orderedGroups = Object.values(groupedMap).sort((a, b) => a.key.localeCompare(b.key));
        return {
            groups: orderedGroups,
            totalHours: total,
            thisWeekHours: thisWk,
            nextWeekHours: nextWk,
        };
    }, [shifts, selectedFilter, tz]);

    const initials = `${employee.first_name?.[0] ?? ""}${employee.last_name?.[0] ?? ""}`.toUpperCase();
    const translateDay = (d: Date) => {
        const dayName = format(d, "EEEE");
        const translated = t(`employee.${dayName}`);
        return translated !== `employee.${dayName}` ? translated : dayName;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
            <div className="max-w-lg mx-auto px-4 pb-10">
                <div className="flex justify-between items-center pt-4">
                    <div className="text-xs text-muted-foreground">{tz}</div>
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border bg-card shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-xl font-bold">
                            {initials || "👤"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs uppercase tracking-wider opacity-75">
                                {t("employee.hi")}
                            </div>
                            <h1 className="text-xl font-bold truncate">{employeeName}</h1>
                            <Badge className={cn("mt-1 border-0 text-xs font-medium", ROLE_STYLES[employee.role] || "bg-white/20 text-white")}>
                                {t(`roles.${employee.role}`) !== `roles.${employee.role}` ? t(`roles.${employee.role}`) : employee.role}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 divide-x border-t">
                        <div className="p-3 text-center">
                            <div className="text-xs text-muted-foreground mb-1">{t("employee.upcoming") !== "employee.upcoming" ? t("employee.upcoming") : "Upcoming"}</div>
                            <div className="text-lg font-bold text-foreground">{shifts.length}</div>
                        </div>
                        <div className="p-3 text-center">
                            <div className="text-xs text-muted-foreground mb-1">{t("employee.this_week") !== "employee.this_week" ? t("employee.this_week") : "This week"}</div>
                            <div className="text-lg font-bold text-foreground">{thisWeekHours.toFixed(1)}h</div>
                        </div>
                        <div className="p-3 text-center">
                            <div className="text-xs text-muted-foreground mb-1">{t("employee.total_hours") !== "employee.total_hours" ? t("employee.total_hours") : "Total"}</div>
                            <div className="text-lg font-bold text-foreground">{totalHours.toFixed(1)}h</div>
                        </div>
                    </div>
                </div>

                <div className="mt-5 flex justify-center">
                    <RequestTimeOff employeeId={employee.id} shareToken={shareToken} label={t("employee.cant_work")} />
                </div>

                {shifts.length > 0 && (
                    <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
                        <FilterChip active={selectedFilter === "all"} onClick={() => setSelectedFilter("all")}>
                            {t("employee.all") !== "employee.all" ? t("employee.all") : "All"} ({shifts.length})
                        </FilterChip>
                        <FilterChip active={selectedFilter === "thisWeek"} onClick={() => setSelectedFilter("thisWeek")}>
                            {t("employee.this_week") !== "employee.this_week" ? t("employee.this_week") : "This week"} · {thisWeekHours.toFixed(1)}h
                        </FilterChip>
                        <FilterChip active={selectedFilter === "nextWeek"} onClick={() => setSelectedFilter("nextWeek")}>
                            {t("employee.next_week") !== "employee.next_week" ? t("employee.next_week") : "Next week"} · {nextWeekHours.toFixed(1)}h
                        </FilterChip>
                    </div>
                )}

                <div className="mt-5 space-y-6">
                    {groups.length === 0 ? (
                        <Card>
                            <CardContent className="p-10 text-center">
                                <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground">{t("employee.no_shifts")}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        groups.map((group) => (
                            <section key={group.key}>
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                        {group.isThisWeek && <span className="text-blue-600 dark:text-blue-400 font-bold">{t("employee.this_week") !== "employee.this_week" ? t("employee.this_week") : "This week"}</span>}
                                        {group.isNextWeek && !group.isThisWeek && <span>{t("employee.next_week") !== "employee.next_week" ? t("employee.next_week") : "Next week"}</span>}
                                        {!group.isThisWeek && !group.isNextWeek && <span>{group.label}</span>}
                                    </h2>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        {group.hours.toFixed(1)}h
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {group.shifts.map((shift) => {
                                        const d = localDate(shift.start_time);
                                        const hours = durationHours(shift);
                                        const isToday = isSameDay(d, toZonedTime(new Date(), tz));
                                        const startLabel = fmt(new Date(shift.start_time), "HH:mm");
                                        const endLabel = fmt(new Date(shift.end_time), "HH:mm");

                                        return (
                                            <Card
                                                key={shift.id}
                                                className={cn(
                                                    "overflow-hidden transition hover:shadow-md border-l-4",
                                                    isToday ? "border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20" : "border-l-border"
                                                )}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className="font-semibold text-foreground truncate">
                                                                    {translateDay(d)}, {fmt(new Date(shift.start_time), "MMM d")}
                                                                </h3>
                                                                {isToday && (
                                                                    <Badge className="bg-blue-500 hover:bg-blue-500 text-white text-[10px] px-1.5 py-0">
                                                                        {t("employee.today") !== "employee.today" ? t("employee.today") : "Today"}
                                                                    </Badge>
                                                                )}
                                                                <DayTaskTag date={d} />
                                                            </div>
                                                            <div className="flex items-center text-muted-foreground text-sm mt-1">
                                                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                                {startLabel} – {endLabel}
                                                                <span className="ml-2 text-xs opacity-70">({hours}h)</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-3">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1 text-xs"
                                                            asChild
                                                        >
                                                            <a
                                                                href={googleCalendarLink(shift, employeeName)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
                                                                {t("employee.add_to_calendar")}
                                                            </a>
                                                        </Button>
                                                        <RejectShiftButton
                                                            employeeId={employee.id}
                                                            date={d}
                                                            shareToken={shareToken}
                                                            label={t("employee.reject_shift")}
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </section>
                        ))
                    )}
                </div>

                <div className="text-center text-[11px] text-muted-foreground py-8">
                    Smart Shift Scheduler · {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition border",
                active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-muted-foreground hover:bg-muted border-border"
            )}
        >
            {children}
        </button>
    );
}
