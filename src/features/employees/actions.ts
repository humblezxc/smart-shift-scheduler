"use server";

import { createSupabaseServerClient, requireOrganization } from "@/lib/supabase-server";
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
    const result = employeeSchema.safeParse(data);

    if (!result.success) {
        return { error: "Validation failed" };
    }

    const supabase = await createSupabaseServerClient();
    const orgId = await getOrgId();

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
    const result = employeeSchema.safeParse(data);

    if (!result.success) {
        return { error: "Validation failed" };
    }

    const supabase = await createSupabaseServerClient();
    const orgId = await getOrgId();

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
    const supabase = await createSupabaseServerClient();
    const orgId = await getOrgId();

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
