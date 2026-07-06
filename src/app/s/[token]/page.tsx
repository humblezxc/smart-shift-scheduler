import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { EmployeeScheduleView } from "@/features/employees/components/employee-schedule-view";
import { addDays } from "date-fns";

export const revalidate = 0;

interface ResolveResult {
    success?: boolean;
    error?: string;
    employee_id?: number;
    organization_id?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    timezone?: string;
}

interface ShiftsResult {
    success?: boolean;
    error?: string;
    shifts?: Array<{ id: number; start_time: string; end_time: string }>;
}

export default async function EmployeeSchedulePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    const { data: resolveData } = await supabase
        .rpc("resolve_share_token", { p_token: token })
        .single<ResolveResult>();

    if (!resolveData?.success || !resolveData.employee_id) {
        return notFound();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = addDays(today, 60);

    const { data: shiftsData } = await supabase
        .rpc("get_shifts_by_share_token", {
            p_token: token,
            p_from: today.toISOString(),
            p_to: horizon.toISOString(),
        })
        .single<ShiftsResult>();

    const timezone = resolveData.timezone || "Europe/Warsaw";

    const employee = {
        id: resolveData.employee_id!,
        first_name: resolveData.first_name || "",
        last_name: resolveData.last_name || "",
        role: resolveData.role || "cashier",
    };

    return (
        <EmployeeScheduleView
            employee={employee}
            shifts={shiftsData?.shifts || []}
            shareToken={token}
            timezone={timezone}
        />
    );
}
