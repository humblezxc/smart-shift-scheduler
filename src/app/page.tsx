import { getWeekRange, getWeekDays } from "@/lib/date-utils";
import { getWeekStats, getShiftsForWeek } from "@/features/scheduler/actions";
import { getEmployees } from "@/features/employees/actions";
import { createSupabaseServerClient, requireOrganization, UserRole } from "@/lib/supabase-server";
import { DashboardView } from "@/features/scheduler/components/dashboard-view";
import { format } from "date-fns";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const userOrg = await requireOrganization();
  const orgId = userOrg.organization_id;
  const userRole = userOrg.role as UserRole;
  const supabase = await createSupabaseServerClient();

  const currentDate = params.date
      ? new Date(params.date)
      : new Date();

  const { start, end } = getWeekRange(currentDate);
  const days = getWeekDays(start);
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const [stats, employees, timeOffsRes, shiftsRes, holidaysRes] = await Promise.all([
    getWeekStats(start, end),
    getEmployees(),
    supabase
        .from("time_off_requests")
        .select(`*, employee:employees (first_name, last_name, role)`)
        .eq("organization_id", orgId)
        .gte("date", startStr)
        .order("date", { ascending: true }),
    getShiftsForWeek(start, end),
    supabase.from("holidays").select("*").eq("organization_id", orgId).gte("date", startStr).lte("date", endStr)
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
          userRole={userRole}
      />
  );
}
