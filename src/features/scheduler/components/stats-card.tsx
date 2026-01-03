"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Clock, Users, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";

interface StatsProps {
    stats: {
        totalShifts: number;
        totalHours: number;
        totalCost: number;
    };
}

export function StatsCard({ stats }: StatsProps) {
    const { t } = useLanguage();

    return (
        <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{t("stats.weekly_stats")}</CardTitle>
                <Button variant="ghost" size="icon" asChild className="h-6 w-6">
                    <Link href="/stats">
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                        <Coins className="mr-2 h-4 w-4 text-green-600" />
                        {t("stats.est_cost")}
                    </div>
                    <div className="font-bold text-lg text-green-700">
                        {stats.totalCost} PLN
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                        <Clock className="mr-2 h-4 w-4 text-blue-500" />
                        {t("stats.hours")}
                    </div>
                    <div className="font-medium">
                        {stats.totalHours} h
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                        <Users className="mr-2 h-4 w-4 text-orange-500" />
                        {t("stats.total_shifts")}
                    </div>
                    <div className="font-medium">
                        {stats.totalShifts}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}