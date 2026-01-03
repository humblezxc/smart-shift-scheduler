import { getWeekRange, getWeekDays } from "@/lib/date-utils";
import { getWeekStats, getShiftsForWeek } from "@/features/scheduler/actions";
import { supabase } from "@/lib/supabase";
import { DashboardView } from "@/features/scheduler/components/dashboard-view";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;

  const currentDate = params.date
      ? new Date(params.date)
      : new Date();

  const { start, end } = getWeekRange(currentDate);
  const days = getWeekDays(start);

  const [stats, employeesRes, timeOffsRes, shiftsRes, holidaysRes] = await Promise.all([
    getWeekStats(start, end),
    supabase.from("employees").select("*").order("first_name"),
    supabase
        .from("time_off_requests")
        .select(`*, employee:employees (first_name, last_name, role)`)
        .gte("date", start.toISOString())
        .order("date", { ascending: true }),
    getShiftsForWeek(start, end),
    supabase.from("holidays").select("*").gte("date", start.toISOString()).lte("date", end.toISOString())
  ]);

  const employees = employeesRes.data || [];
  const timeOffs = timeOffsRes.data || [];
  const shifts = shiftsRes || [];
  const holidays = holidaysRes.data || [];

  return (
      <DashboardView
          currentDate={currentDate}
          stats={stats}
          employees={employees}
          timeOffs={timeOffs}
          shifts={shifts}
          holidays={holidays}
          days={days}
      />
  );
}