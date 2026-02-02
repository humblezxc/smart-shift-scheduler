import { getWeekRange, getWeekDays } from "@/lib/date-utils";
import { getWeekStats, getShiftsForWeek } from "@/features/scheduler/actions";
import { getEmployees } from "@/features/employees/actions";
import { createSupabaseServerClient, requireOrganization } from "@/lib/supabase-server";
import { DashboardView } from "@/features/scheduler/components/dashboard-view";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const userOrg = await requireOrganization();
  const orgId = userOrg.organization_id;
  const supabase = await createSupabaseServerClient();

  const currentDate = params.date
      ? new Date(params.date)
      : new Date();

  const { start, end } = getWeekRange(currentDate);
  const days = getWeekDays(start);

  const [stats, employees, timeOffsRes, shiftsRes, holidaysRes] = await Promise.all([
    getWeekStats(start, end),
    getEmployees(),
    supabase
        .from("time_off_requests")
        .select(`*, employee:employees (first_name, last_name, role)`)
        .eq("organization_id", orgId)
        .gte("date", start.toISOString())
        .order("date", { ascending: true }),
    getShiftsForWeek(start, end),
    supabase.from("holidays").select("*").eq("organization_id", orgId).gte("date", start.toISOString()).lte("date", end.toISOString())
  ]);

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
