import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { EmployeeScheduleView } from "@/features/employees/components/employee-schedule-view";

export default async function EmployeeSchedulePage({ params, }: { params: Promise<{ token: string }>; }) {
    const { token } = await params;

    const { data: employee } = await supabase
        .from("employees")
        .select("*")
        .eq("share_token", token)
        .single();

    if (!employee) {
        return notFound();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: shifts } = await supabase
        .from("shifts")
        .select("*")
        .eq("employee_id", employee.id)
        .gte("start_time", today.toISOString())
        .order("start_time", { ascending: true });

    return <EmployeeScheduleView employee={employee} shifts={shifts || []} />;
}