"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { StatsViewClient } from "@/features/scheduler/components/stats-view-client";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { format, addMonths, subMonths } from "date-fns";
import { uk, pl, enUS } from "date-fns/locale";
import { getDetailedStats } from "@/features/scheduler/actions";

interface Props {
    monthStats: any;
    allTimeStats: any;
    today: Date;
}

export function StatsWrapperClient({ monthStats: initialMonthStats, allTimeStats, today }: Props) {
    const { t, language } = useLanguage();
    const [selectedMonth, setSelectedMonth] = useState(new Date(today));
    const [monthStats, setMonthStats] = useState(initialMonthStats);
    const [isLoading, setIsLoading] = useState(false);

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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{t("stats.title")}</h1>
                            <p className="text-gray-500">{t("stats.subtitle") || "Detailed breakdown of hours and earnings."}</p>
                        </div>
                    </div>
                    <LanguageSwitcher />
                </div>

                <Tabs defaultValue="month" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="month">{t("stats.month")}</TabsTrigger>
                        <TabsTrigger value="all">{t("stats.all_time")}</TabsTrigger>
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
                            <div className="text-center py-8 text-gray-500">{t("common.loading") || "Loading..."}</div>
                        ) : (
                            <StatsViewClient data={monthStats} period="month" />
                        )}
                    </TabsContent>
                    <TabsContent value="all" className="space-y-4">
                        <StatsViewClient data={allTimeStats} period="all" />
                    </TabsContent>
                </Tabs>

            </div>
        </div>
    );
}