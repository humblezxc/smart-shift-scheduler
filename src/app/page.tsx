import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { EmployeeList } from "@/features/employees/components/employee-list";
import { AddEmployeeDialog } from "@/features/employees/components/add-employee-dialog";
import { ScheduleGrid } from "@/features/scheduler/components/schedule-grid";

export default function Dashboard() {
  return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b h-16 flex items-center px-6 justify-between">
          <h1 className="text-xl font-bold tracking-tight">🏪 Smart Shift Scheduler</h1>
          <div className="flex gap-4">
            <AddEmployeeDialog />
            <Button>Generate Schedule (AI)</Button>
          </div>
        </header>

        <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Week</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar mode="single" className="rounded-md border mx-auto" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-500">
                <p>Total Shifts: 0</p>
                <p>Estimated Cost: 0 PLN</p>
              </CardContent>
            </Card>

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
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Weekly Schedule</h2>
              <div className="text-sm text-gray-500">Current Week</div>
            </div>

            <ScheduleGrid />
          </section>
        </main>
      </div>
  );
}