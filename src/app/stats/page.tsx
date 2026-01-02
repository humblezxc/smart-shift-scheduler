import { getDetailedStats } from "@/features/scheduler/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coins, Users } from "lucide-react";
import Link from "next/link";

export default async function StatsPage() {
    const today = new Date();

    const [monthStats, allTimeStats] = await Promise.all([
        getDetailedStats('month', today),
        getDetailedStats('all', today)
    ]);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Financial Statistics</h1>
                        <p className="text-gray-500">Detailed breakdown of hours and earnings.</p>
                    </div>
                </div>
                <Tabs defaultValue="month" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="month">This Month ({format(today, "MMMM")})</TabsTrigger>
                        <TabsTrigger value="all">All Time</TabsTrigger>
                    </TabsList>
                    <TabsContent value="month" className="space-y-4">
                        <StatsView data={monthStats} period="Month" />
                    </TabsContent>
                    <TabsContent value="all" className="space-y-4">
                        <StatsView data={allTimeStats} period="All Time" />
                    </TabsContent>
                </Tabs>

            </div>
        </div>
    );
}

function StatsView({ data, period }: { data: any, period: string }) {
    if (!data) return <div>No data available</div>;

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
                        <CardTitle className="text-sm font-medium">Total Cost ({period})</CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Math.round(totalCost)} PLN</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Staff Cost (Cashier/Student)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{data.staffTotalEarned} PLN</div>
                        <p className="text-xs text-muted-foreground">Excluding Managers/Owners</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
                        <div className="text-2xl font-bold">{data.totalShifts}</div>
                    </CardHeader>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Employee Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Hours Worked</TableHead>
                                <TableHead className="text-right">Earned</TableHead>
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
                                                {emp.role}
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