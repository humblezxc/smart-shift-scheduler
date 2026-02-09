"use server";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient, requireOrganization, requireRole } from "@/lib/supabase-server";
import { employeeSchema, EmployeeFormValues } from "./schemas";
import { revalidatePath } from "next/cache";

async function getOrgId() {
    const userOrg = await requireOrganization();
    return userOrg.organization_id;
}

export async function getEmployees() {
    const supabase = await createSupabaseServerClient();
    const orgId = await getOrgId();

    const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("organization_id", orgId)
        .order("first_name");

    if (error) {
        console.error("Error fetching employees:", error);
        return [];
    }

    return data || [];
}

export async function createEmployee(data: EmployeeFormValues) {
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;

    const result = employeeSchema.safeParse(data);

    if (!result.success) {
        return { error: "Validation failed" };
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("employees").insert({
        ...result.data,
        organization_id: orgId,
    });

    if (error) {
        console.error(error);
        return { error: "Database error: Could not save employee" };
    }

    revalidatePath("/");

    return { success: true };
}

export async function updateEmployee(id: number, data: EmployeeFormValues) {
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;

    const result = employeeSchema.safeParse(data);

    if (!result.success) {
        return { error: "Validation failed" };
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("employees")
        .update(result.data)
        .eq("id", id)
        .eq("organization_id", orgId);

    if (error) {
        console.error(error);
        return { error: "Database error: Could not update employee" };
    }

    revalidatePath("/");

    return { success: true };
}

export async function deleteEmployee(id: number) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const orgId = userOrg.organization_id;
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id)
        .eq("organization_id", orgId);

    if (error) {
        console.error(error);
        return { error: "Database error: Could not delete employee" };
    }

    revalidatePath("/");

    return { success: true };
}

export async function createPublicTimeOffRequest(data: {
    employee_id: number;
    share_token: string;
    date: string;
    reason?: string;
}) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: result, error } = await supabase
        .rpc("create_public_time_off_request", {
            p_employee_id: data.employee_id,
            p_share_token: data.share_token,
            p_date: data.date,
            p_reason: data.reason || "Requested via link",
        })
        .single<{ success: boolean; error?: string }>();

    if (error) {
        console.error("Public time off error:", error);
        return { error: "Failed to request time off" };
    }

    if (!result?.success) {
        return { error: result?.error || "Failed to request time off" };
    }

    return { success: true };
}
