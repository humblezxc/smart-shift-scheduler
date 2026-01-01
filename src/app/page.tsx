import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeList } from "@/features/employees/components/employee-list";
import { AddEmployeeDialog } from "@/features/employees/components/add-employee-dialog";
import { ScheduleGrid } from "@/features/scheduler/components/schedule-grid";
import { GenerateButton } from "@/features/scheduler/components/generate-button";
import { WeekNavigation } from "@/features/scheduler/components/week-navigation";
import { CalendarPicker } from "@/features/scheduler/components/calendar-picker";
import { getWeekRange } from "@/lib/date-utils";
import { getWeekStats } from "@/features/scheduler/actions";
import { StatsCard } from "@/features/scheduler/components/stats-card";
export default async function Dashboard({searchParams,}: { searchParams: Promise<{ date?: string }>; }) {
  const params = await searchParams;

  const currentDate = params.date
      ? new Date(params.date)
      : new Date();

  const { start, end } = getWeekRange(currentDate);

  const stats = await getWeekStats(start, end);

  return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b h-16 flex items-center px-6 justify-between">
          <h1 className="text-xl font-bold tracking-tight">🏪 Smart Shift Scheduler</h1>
          <div className="flex gap-4">
            <AddEmployeeDialog />
            <GenerateButton />
          </div>
        </header>

        <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Week</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarPicker />
              </CardContent>
            </Card>

            <StatsCard stats={stats} />

            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>Staff</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="scale-90 origin-top-left w-[110%]">
                  <EmployeeList />
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-6">
            <WeekNavigation />
            <ScheduleGrid date={currentDate} />
          </section>
        </main>
      </div>
  );
}