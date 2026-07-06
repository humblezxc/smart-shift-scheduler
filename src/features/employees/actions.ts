"use server";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient, requireOrganization, requireRole } from "@/lib/supabase-server";
import { employeeSchema, EmployeeFormValues } from "./schemas";
import { revalidatePath, updateTag } from "next/cache";
import { canAddEmployee, SubscriptionTier } from "@/lib/stripe";
import { cacheTags } from "@/lib/supabase-admin";
import { fetchEmployeesForOrg, fetchArchivedEmployeesForOrg } from "@/lib/cached-queries";

async function getOrgId() {
    const userOrg = await requireOrganization();
    return userOrg.organization_id;
}

function invalidateEmployees(orgId: string) {
    updateTag(cacheTags.employees(orgId));
}

export async function getEmployees(options: { includeArchived?: boolean } = {}) {
    const orgId = await getOrgId();
    return fetchEmployeesForOrg(orgId, options.includeArchived === true);
}

export async function getArchivedEmployees() {
    const orgId = await getOrgId();
    return fetchArchivedEmployeesForOrg(orgId);
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

    const [{ data: org }, { count }] = await Promise.all([
        supabase
            .from("organizations")
            .select("subscription_tier")
            .eq("id", orgId)
            .single(),
        supabase
            .from("employees")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", orgId)
            .is("archived_at", null),
    ]);

    const tier = (org?.subscription_tier || "free") as SubscriptionTier;

    if (!canAddEmployee(tier, count || 0)) {
        return { error: "Employee limit reached. Upgrade your plan to add more employees." };
    }

    const { error } = await supabase.from("employees").insert({
        ...result.data,
        organization_id: orgId,
    });

    if (error) {
        return { error: "Database error: Could not save employee" };
    }

    invalidateEmployees(orgId);
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
        return { error: "Database error: Could not update employee" };
    }

    invalidateEmployees(orgId);
    revalidatePath("/");

    return { success: true };
}

export async function deleteEmployee(id: number) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .rpc("soft_delete_employee", { p_employee_id: id })
        .single<{ success: boolean; error?: string; future_shifts_removed?: number }>();

    if (error || !data?.success) {
        return { error: data?.error || "Database error: Could not archive employee" };
    }

    invalidateEmployees(userOrg.organization_id);
    revalidatePath("/");
    revalidatePath("/stats");

    return { success: true, futureShiftsRemoved: data.future_shifts_removed ?? 0 };
}

export async function restoreEmployee(id: number) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .rpc("restore_employee", { p_employee_id: id })
        .single<{ success: boolean; error?: string }>();

    if (error || !data?.success) {
        return { error: data?.error || "Database error: Could not restore employee" };
    }

    invalidateEmployees(userOrg.organization_id);
    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true };
}

export async function createPublicTimeOffRequest(data: {
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
            p_token: data.share_token,
            p_date: data.date,
            p_reason: data.reason || "Requested via share link",
        })
        .single<{ success: boolean; error?: string }>();

    if (error) {
        return { error: "Failed to request time off" };
    }

    if (!result?.success) {
        return { error: result?.error || "Failed to request time off" };
    }

    return { success: true };
}

export async function rotateEmployeeShareLink(employeeId: number, ttlDays = 90) {
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .rpc("rotate_share_token", {
            p_employee_id: employeeId,
            p_ttl_days: ttlDays,
        })
        .single<{ success: boolean; token?: string; expires_at?: string; error?: string }>();

    if (error) {
        return { error: `Rotate failed: ${error.message}${error.hint ? ` (${error.hint})` : ""}` };
    }
    if (!data) {
        return { error: "Rotate failed: no response from RPC (did migration 015 run on this DB?)" };
    }
    if (!data.success || !data.token) {
        return { error: `Rotate failed: ${data.error ?? "RPC returned success=false without a token"}` };
    }

    invalidateEmployees(userOrg.organization_id);
    revalidatePath("/");

    return {
        success: true,
        token: data.token,
        expiresAt: data.expires_at ?? null,
    };
}

export async function revokeEmployeeShareLinks(employeeId: number) {
    const { error: roleError, userOrg } = await requireRole('manager');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .rpc("revoke_share_tokens", { p_employee_id: employeeId })
        .single<{ success: boolean; revoked?: number; error?: string }>();

    if (error) {
        return { error: `Revoke failed: ${error.message}${error.hint ? ` (${error.hint})` : ""}` };
    }
    if (!data?.success) {
        return { error: `Revoke failed: ${data?.error ?? "RPC returned success=false"}` };
    }

    invalidateEmployees(userOrg.organization_id);
    revalidatePath("/");

    return { success: true, revoked: data.revoked ?? 0 };
}
