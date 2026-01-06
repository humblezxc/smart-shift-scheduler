"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeList } from "@/features/employees/components/employee-list";
import { AddEmployeeDialog } from "@/features/employees/components/add-employee-dialog";
import { ScheduleGridClient } from "@/features/scheduler/components/schedule-grid-client";
import { GenerateButton } from "@/features/scheduler/components/generate-button";
import { WeekNavigation } from "@/features/scheduler/components/week-navigation";
import { CalendarPicker } from "@/features/scheduler/components/calendar-picker";
import { StatsCard } from "@/features/scheduler/components/stats-card";
import { TimeOffList } from "@/features/scheduler/components/time-off-list";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/context/language-context";
import { Employee } from "@/types";
import { ExportMenu } from "@/features/scheduler/components/export-menu";

interface DashboardViewProps {
    stats: any;
    currentDate: Date;
    employees: Employee[];
    timeOffs: any[];
    shifts: any[];
    holidays: any[];
    days: Date[];
}

export function DashboardView({stats, currentDate, employees, timeOffs, shifts, holidays, days}: DashboardViewProps) {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b h-16 flex items-center px-6 justify-between sticky top-0 z-10">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-800">
                        {t("common.welcome")}
                    </h1>
                    <p className="text-xs text-gray-500 hidden sm:block">
                        {t("common.subtitle")}
                    </p>
                </div>

                <div className="flex gap-2 sm:gap-4 items-center">
                    <LanguageSwitcher />
                    <AddEmployeeDialog />
                    <ExportMenu currentDate={currentDate} employees={employees} />
                    <GenerateButton />
                </div>
            </header>
            <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
                <aside className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("common.schedule")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CalendarPicker />
                        </CardContent>
                    </Card>
                    <StatsCard stats={stats} />
                    <div className="h-[350px]">
                        <TimeOffList requests={timeOffs} />
                    </div>

                    <Card className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle>{t("common.staff")}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="scale-90 origin-top-left w-[110%]">
                                <EmployeeList employees={employees} />
                            </div>
                        </CardContent>
                    </Card>
                </aside>
                <section className="space-y-6">
                    <WeekNavigation />
                    <ScheduleGridClient
                        initialShifts={shifts}
                        employees={employees}
                        days={days}
                        holidays={holidays}
                    />
                </section>
            </main>
        </div>
    );
}