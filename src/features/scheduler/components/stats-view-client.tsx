"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, Users } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function StatsViewClient({ data, period }: { data: any, period: 'month' | 'all' }) {
    const { t } = useLanguage();

    if (!data) return <div>{t("common.error") || "No data available"}</div>;

    const totalCost = data.byEmployee.reduce((acc: number, curr: any) => acc + curr.earned, 0);

    const roleBadgeColors: Record<string, string> = {
        owner: "bg-purple-100 text-purple-700 hover:bg-purple-100",
        manager: "bg-amber-100 text-amber-700 hover:bg-amber-100",
        cashier: "bg-blue-100 text-blue-700 hover:bg-blue-100",
        student: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    };

    return (
        <>
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {t("stats.total_cost")} ({period === 'month' ? t("stats.month") : t("stats.all_time")})
                        </CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(totalCost)} PLN</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("stats.staff_cost")}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{data.staffTotalEarned} PLN</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t("stats.total_shifts")}</CardTitle>
                        <div className="text-2xl font-bold">{data.totalShifts}</div>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("stats.breakdown")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("common.employees_list")}</TableHead>
                                <TableHead>{t("common.role")}</TableHead>
                                <TableHead className="text-right">{t("stats.hours")}</TableHead>
                                <TableHead className="text-right">{t("stats.earned")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.byEmployee
                                .sort((a: any, b: any) => b.earned - a.earned)
                                .map((emp: any) => (
                                    <TableRow key={emp.name}>
                                        <TableCell className="font-medium">{emp.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`border-0 ${roleBadgeColors[emp.role] || "bg-gray-100 text-gray-700"}`}>
                                                {t(`roles.${emp.role}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{emp.hours.toFixed(1)} h</TableCell>
                                        <TableCell className="text-right font-mono font-bold text-green-700">
                                            {Math.round(emp.earned)} PLN
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}