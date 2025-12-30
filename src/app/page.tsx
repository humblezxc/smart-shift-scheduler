import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {EmployeeList} from "@/features/employees/components/employee-list";

export default function Dashboard() {
  return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b h-16 flex items-center px-6 justify-between">
          <h1 className="text-xl font-bold tracking-tight">🏪 Smart Shift Scheduler</h1>
          <div className="flex gap-4">
            <Button variant="outline">Employees</Button>
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
                <Calendar mode="single" className="rounded-md border" />
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
          </aside>

          <section className="space-y-6">
            <Card className="h-full min-h-[500px]">
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-gray-400 border-2 border-dashed rounded-lg">
                  No shifts generated yet. Click "Generate" to start.
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="col-span-1 md:col-span-2 mt-6">
            <h2 className="text-lg font-semibold mb-4">Staff Overview</h2>
            <EmployeeList />
          </section>
        </main>
      </div>
  );
}