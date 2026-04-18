import { getWeekRange, getWeekDays } from "@/lib/date-utils";
import { getShiftsForWeek } from "@/features/scheduler/actions";
import { getEmployees } from "@/features/employees/actions";
import { createSupabaseServerClient, requireOrganization, UserRole, checkOnboardingStatus, getOrgScheduleConfig } from "@/lib/supabase-server";
import { computeWeekStats } from "@/lib/shift-utils";
import { DashboardView } from "@/features/scheduler/components/dashboard-view";
import { format } from "date-fns";
import { redirect } from "next/navigation";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const userOrg = await requireOrganization();
  const orgId = userOrg.organization_id;

  const { weekStartsOn } = await getOrgScheduleConfig(orgId);

  const currentDate = params.date ? new Date(params.date) : new Date();
  const { start, end } = getWeekRange(currentDate, weekStartsOn);
  const days = getWeekDays(start);
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const supabase = await createSupabaseServerClient();

  const [onboarding, employees, timeOffsRes, shifts, holidaysRes] = await Promise.all([
    checkOnboardingStatus(orgId),
    getEmployees(),
    supabase
        .from("time_off_requests")
        .select(`*, employee:employees (first_name, last_name, role)`)
        .eq("organization_id", orgId)
        .gte("date", startStr)
        .order("date", { ascending: true }),
    getShiftsForWeek(start, end),
    supabase
        .from("holidays")
        .select("date, name")
        .eq("organization_id", orgId)
        .gte("date", startStr)
        .lte("date", endStr),
  ]);

  if (onboarding.needsOnboarding) {
    redirect("/onboarding");
  }

  const stats = computeWeekStats(shifts);
  const userRole = userOrg.role as UserRole;

  return (
      <DashboardView
          currentDate={currentDate}
          stats={stats}
          employees={employees}
          timeOffs={timeOffsRes.data || []}
          shifts={shifts}
          holidays={holidaysRes.data || []}
          days={days}
          userRole={userRole}
          weekStartsOn={weekStartsOn}
      />
  );
}
