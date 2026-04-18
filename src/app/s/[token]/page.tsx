import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { EmployeeScheduleView } from "@/features/employees/components/employee-schedule-view";
import { addDays } from "date-fns";

export const revalidate = 60;

export default async function EmployeeSchedulePage({ params, }: { params: Promise<{ token: string }>; }) {
    const { token } = await params;

    const { data: employee } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, share_token, share_token_expires_at, share_token_revoked, organization_id, archived_at")
        .eq("share_token", token)
        .single();

    if (!employee || employee.share_token_revoked || employee.archived_at) {
        return notFound();
    }

    if (employee.share_token_expires_at && new Date(employee.share_token_expires_at) < new Date()) {
        return notFound();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = addDays(today, 60);

    const [shiftsRes, settingsRes] = await Promise.all([
        supabase
            .from("shifts")
            .select("id, start_time, end_time")
            .eq("employee_id", employee.id)
            .gte("start_time", today.toISOString())
            .lte("start_time", horizon.toISOString())
            .order("start_time", { ascending: true })
            .limit(100),
        supabase
            .from("organization_settings")
            .select("timezone, currency")
            .eq("organization_id", employee.organization_id)
            .single(),
    ]);

    const timezone = settingsRes.data?.timezone || "Europe/Warsaw";

    return (
        <EmployeeScheduleView
            employee={employee}
            shifts={shiftsRes.data || []}
            shareToken={token}
            timezone={timezone}
        />
    );
}
