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
import { MobileNav } from "@/features/scheduler/components/mobile-nav";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { SettingsButton } from "@/features/settings/components/settings-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccountButton } from "@/features/account/components/account-button";
import { UserRole } from "@/lib/supabase-server";

interface DashboardViewProps {
    stats: any;
    currentDate: Date;
    employees: Employee[];
    timeOffs: any[];
    shifts: any[];
    holidays: any[];
    days: Date[];
    userRole: UserRole;
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export function DashboardView({stats, currentDate, employees, timeOffs, shifts, holidays, days, userRole, weekStartsOn}: DashboardViewProps) {
    const { t } = useLanguage();
    const canManage = userRole === 'owner' || userRole === 'admin' || userRole === 'manager';

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="bg-card border-b h-16 flex items-center px-4 sm:px-6 justify-between sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate max-w-[200px] sm:max-w-none">
                        {t("common.welcome")}
                    </h1>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                        {t("common.subtitle")}
                    </p>
                </div>
                <div className="hidden md:flex gap-2 sm:gap-4 items-center">
                    <ThemeToggle />
                    <LanguageSwitcher />
                    {canManage && <AddEmployeeDialog roster={employees} />}
                    <ExportMenu currentDate={currentDate} employees={employees} />
                    {canManage && <GenerateButton />}
                    <SettingsButton />
                    <AccountButton />
                    <LogoutButton />
                </div>
                <div className="md:hidden">
                    <MobileNav currentDate={currentDate} employees={employees} canManage={canManage} />
                </div>
            </header>
            <main className="flex-1 p-3 sm:p-6 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4 sm:gap-6">
                <aside className="space-y-4 sm:space-y-6 order-last md:order-first">
                    <Card>
                        <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-base sm:text-lg">{t("common.schedule")}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                            <CalendarPicker weekStartsOn={weekStartsOn} />
                        </CardContent>
                    </Card>

                    <StatsCard stats={stats} />

                    <div className="h-[350px]">
                        <TimeOffList requests={timeOffs} canManage={canManage} />
                    </div>

                    <Card className="overflow-hidden">
                        <CardHeader className="pb-2 p-4 sm:p-6">
                            <CardTitle className="text-base sm:text-lg">{t("common.staff")}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="sm:scale-90 sm:origin-top-left sm:w-[110%] w-full overflow-x-auto">
                                <EmployeeList employees={employees} canManage={canManage} />
                            </div>
                        </CardContent>
                    </Card>
                </aside>
                <section className="space-y-4 sm:space-y-6 overflow-hidden">
                    <WeekNavigation weekStartsOn={weekStartsOn} />
                    <div className="overflow-x-auto pb-2">
                        <div className="min-w-[600px] md:min-w-0">
                            <ScheduleGridClient
                                initialShifts={shifts}
                                employees={employees}
                                days={days}
                                holidays={holidays}
                                canManage={canManage}
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}