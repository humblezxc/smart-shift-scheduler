"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { StatsViewClient } from "@/features/scheduler/components/stats-view-client";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { format } from "date-fns";

interface Props {
    monthStats: any;
    allTimeStats: any;
    today: Date;
}

export function StatsWrapperClient({ monthStats, allTimeStats, today }: Props) {
    const { t } = useLanguage();

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
                        <TabsTrigger value="month">{t("stats.month")} ({format(today, "MMMM")})</TabsTrigger>
                        <TabsTrigger value="all">{t("stats.all_time")}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="month" className="space-y-4">
                        <StatsViewClient data={monthStats} period="month" />
                    </TabsContent>
                    <TabsContent value="all" className="space-y-4">
                        <StatsViewClient data={allTimeStats} period="all" />
                    </TabsContent>
                </Tabs>

            </div>
        </div>
    );
}