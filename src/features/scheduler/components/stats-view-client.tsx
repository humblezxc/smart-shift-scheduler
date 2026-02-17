"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, Users } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function StatsViewClient({ data, period }: { data: any, period: 'month' | 'all' }) {
    const { t } = useLanguage();

    if (!data) return <div>{t("common.error") || "No data available"}</div>;

    const totalCost = data.byEmployee.reduce((acc: number, curr: any) => acc + curr.earned, 0);

    const roleBadgeColors: Record<string, string> = {
        owner: "bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-950/80",
        manager: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-950/80",
        cashier: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-950/80",
        student: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950/80",
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

            {data.byEmployee.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t("stats.hours")} & {t("stats.earned")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.byEmployee.sort((a: any, b: any) => b.earned - a.earned).map((emp: any) => ({
                                name: emp.name.split(" ")[0],
                                hours: Math.round(emp.hours * 10) / 10,
                                cost: Math.round(emp.earned),
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Bar dataKey="hours" fill="hsl(var(--chart-2))" name={t("stats.hours") || "Hours"} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="cost" fill="hsl(var(--chart-1))" name="PLN" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

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
                                            <Badge variant="outline" className={`border-0 ${roleBadgeColors[emp.role] || "bg-muted text-muted-foreground"}`}>
                                                {t(`roles.${emp.role}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{emp.hours.toFixed(1)} h</TableCell>
                                        <TableCell className="text-right font-mono font-bold text-green-700 dark:text-green-400">
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