"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { StatsViewClient } from "@/features/scheduler/components/stats-view-client";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, endOfDay } from "date-fns";
import { uk, pl, enUS } from "date-fns/locale";
import { getDetailedStats, getDetailedStatsByRange } from "@/features/scheduler/actions";
import { getEmployees } from "@/features/employees/actions";

interface Props {
    monthStats: any;
    allTimeStats: any;
    today: Date;
}

export function StatsWrapperClient({ monthStats: initialMonthStats, allTimeStats, today }: Props) {
    const { t, language } = useLanguage();
    const [activeTab, setActiveTab] = useState("month");
    const [selectedMonth, setSelectedMonth] = useState(new Date(today));
    const [monthStats, setMonthStats] = useState(initialMonthStats);
    const [isLoading, setIsLoading] = useState(false);

    const [fromDate, setFromDate] = useState<Date | undefined>(startOfMonth(new Date(today)));
    const [toDate, setToDate] = useState<Date | undefined>(endOfMonth(new Date(today)));
    const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
    const [employees, setEmployees] = useState<any[]>([]);
    const [rangeStats, setRangeStats] = useState<any>(null);
    const [rangeLoading, setRangeLoading] = useState(false);

    const localeMap = { uk, pl, en: enUS };
    const locale = localeMap[language as keyof typeof localeMap] || enUS;

    const goToPrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
    const goToNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

    useEffect(() => {
        async function fetchMonthStats() {
            setIsLoading(true);
            const stats = await getDetailedStats('month', selectedMonth);
            setMonthStats(stats);
            setIsLoading(false);
        }
        fetchMonthStats();
    }, [selectedMonth]);

    useEffect(() => {
        getEmployees().then(setEmployees);
    }, []);

    useEffect(() => {
        if (activeTab !== "range" || !fromDate || !toDate) return;
        setRangeLoading(true);
        getDetailedStatsByRange(
            fromDate,
            toDate,
            selectedEmployee === "all" ? undefined : selectedEmployee
        )
            .then(setRangeStats)
            .finally(() => setRangeLoading(false));
    }, [fromDate, toDate, selectedEmployee, activeTab]);

    const rangeLabel = fromDate && toDate
        ? `${format(fromDate, "MMM d")} – ${format(toDate, "MMM d, yyyy")}`
        : undefined;

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{t("stats.title")}</h1>
                            <p className="text-muted-foreground">{t("stats.subtitle") || "Detailed breakdown of hours and earnings."}</p>
                        </div>
                    </div>
                    <LanguageSwitcher />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="month">{t("stats.month")}</TabsTrigger>
                        <TabsTrigger value="all">{t("stats.all_time")}</TabsTrigger>
                        <TabsTrigger value="range">{t("stats.custom_range") || "Custom Range"}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="month" className="space-y-4">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <Button variant="outline" size="icon" onClick={goToPrevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold min-w-[150px] text-center capitalize">
                                {format(selectedMonth, "LLLL yyyy", { locale })}
                            </span>
                            <Button variant="outline" size="icon" onClick={goToNextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">{t("common.loading") || "Loading..."}</div>
                        ) : (
                            <StatsViewClient data={monthStats} period="month" />
                        )}
                    </TabsContent>

                    <TabsContent value="all" className="space-y-4">
                        <StatsViewClient data={allTimeStats} period="all" />
                    </TabsContent>

                    <TabsContent value="range" className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{t("stats.from_date") || "From"}:</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {fromDate ? format(fromDate, "MMM d, yyyy") : "Pick date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={fromDate}
                                            onSelect={setFromDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{t("stats.to_date") || "To"}:</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {toDate ? format(toDate, "MMM d, yyyy") : "Pick date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={toDate}
                                            onSelect={(date) => setToDate(date ? endOfDay(date) : undefined)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder={t("stats.all_employees") || "All Employees"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("stats.all_employees") || "All Employees"}</SelectItem>
                                    {employees.map((emp: any) => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {rangeLoading ? (
                            <div className="text-center py-8 text-muted-foreground">{t("common.loading") || "Loading..."}</div>
                        ) : rangeStats ? (
                            <StatsViewClient
                                data={rangeStats}
                                period="range"
                                rangeLabel={rangeLabel}
                                shifts={rangeStats.shifts}
                            />
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {t("stats.no_data_range") || "No data for selected range"}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
