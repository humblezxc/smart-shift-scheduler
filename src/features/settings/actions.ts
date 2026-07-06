"use server";

import { createSupabaseServerClient, requireOrganization, requireRole } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface ShiftTemplate {
    id: string;
    name: string;
    start_time: string;
    end_time: string;
    applicable_days: string[];
}

export interface OrganizationSettings {
    organization_id: string;
    timezone: string;
    currency: string;
    week_starts_on: number;
    shift_templates: ShiftTemplate[];
    custom_roles: string[];
}

export async function getOrganizationSettings(): Promise<OrganizationSettings | null> {
    const userOrg = await requireOrganization();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("organization_settings")
        .select("*")
        .eq("organization_id", userOrg.organization_id)
        .single();

    if (error || !data) return null;

    return {
        organization_id: data.organization_id,
        timezone: data.timezone || "UTC",
        currency: data.currency || "PLN",
        week_starts_on: data.week_starts_on ?? 1,
        shift_templates: data.shift_templates || [],
        custom_roles: data.custom_roles || [],
    };
}

export async function getOrganization() {
    const userOrg = await requireOrganization();
    const supabase = await createSupabaseServerClient();

    const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", userOrg.organization_id)
        .single();

    return data;
}

export async function updateOrganizationName(name: string) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("organizations")
        .update({ name })
        .eq("id", userOrg.organization_id);

    if (error) {
        return { error: "Failed to update organization name" };
    }

    revalidatePath("/settings");
    return { success: true };
}

const updateSettingsSchema = z.object({
    timezone: z.string().min(1).optional(),
    currency: z.string().min(1).optional(),
    week_starts_on: z.number().int().min(0).max(6).optional(),
    shift_templates: z.array(z.object({
        id: z.string(),
        name: z.string(),
        start_time: z.string(),
        end_time: z.string(),
        applicable_days: z.array(z.string()),
    })).optional(),
    custom_roles: z.array(z.string()).optional(),
});

export async function updateSettings(settings: Partial<Omit<OrganizationSettings, "organization_id">>) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };

    const result = updateSettingsSchema.safeParse(settings);
    if (!result.success) {
        return { error: "Validation failed" };
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("organization_settings")
        .update(result.data)
        .eq("organization_id", userOrg.organization_id);

    if (error) {
        return { error: "Failed to update settings" };
    }

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
}

export async function addShiftTemplate(template: Omit<ShiftTemplate, "id">) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };

    const supabase = await createSupabaseServerClient();

    const { data: current } = await supabase
        .from("organization_settings")
        .select("shift_templates")
        .eq("organization_id", userOrg.organization_id)
        .single();

    const templates = current?.shift_templates || [];
    const newTemplate = {
        ...template,
        id: crypto.randomUUID(),
    };

    const { error } = await supabase
        .from("organization_settings")
        .update({ shift_templates: [...templates, newTemplate] })
        .eq("organization_id", userOrg.organization_id);

    if (error) {
        return { error: "Failed to add shift template" };
    }

    revalidatePath("/settings");
    return { success: true };
}

export async function updateShiftTemplate(id: string, template: Partial<ShiftTemplate>) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };

    const supabase = await createSupabaseServerClient();

    const { data: current } = await supabase
        .from("organization_settings")
        .select("shift_templates")
        .eq("organization_id", userOrg.organization_id)
        .single();

    const templates = (current?.shift_templates || []).map((t: ShiftTemplate) =>
        t.id === id ? { ...t, ...template } : t
    );

    const { error } = await supabase
        .from("organization_settings")
        .update({ shift_templates: templates })
        .eq("organization_id", userOrg.organization_id);

    if (error) {
        return { error: "Failed to update shift template" };
    }

    revalidatePath("/settings");
    return { success: true };
}

export async function deleteShiftTemplate(id: string) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };

    const supabase = await createSupabaseServerClient();

    const { data: current } = await supabase
        .from("organization_settings")
        .select("shift_templates")
        .eq("organization_id", userOrg.organization_id)
        .single();

    const templates = (current?.shift_templates || []).filter((t: ShiftTemplate) => t.id !== id);

    const { error } = await supabase
        .from("organization_settings")
        .update({ shift_templates: templates })
        .eq("organization_id", userOrg.organization_id);

    if (error) {
        return { error: "Failed to delete shift template" };
    }

    revalidatePath("/settings");
    return { success: true };
}

export async function addCustomRole(role: string) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };

    const supabase = await createSupabaseServerClient();

    const { data: current } = await supabase
        .from("organization_settings")
        .select("custom_roles")
        .eq("organization_id", userOrg.organization_id)
        .single();

    const roles = current?.custom_roles || [];
    if (roles.includes(role)) {
        return { error: "Role already exists" };
    }

    const { error } = await supabase
        .from("organization_settings")
        .update({ custom_roles: [...roles, role] })
        .eq("organization_id", userOrg.organization_id);

    if (error) {
        return { error: "Failed to add custom role" };
    }

    revalidatePath("/settings");
    return { success: true };
}

export async function deleteCustomRole(role: string) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) return { error: roleError || "Not authorized" };

    const supabase = await createSupabaseServerClient();

    const { data: current } = await supabase
        .from("organization_settings")
        .select("custom_roles")
        .eq("organization_id", userOrg.organization_id)
        .single();

    const roles = (current?.custom_roles || []).filter((r: string) => r !== role);

    const { error } = await supabase
        .from("organization_settings")
        .update({ custom_roles: roles })
        .eq("organization_id", userOrg.organization_id);

    if (error) {
        return { error: "Failed to delete custom role" };
    }

    revalidatePath("/settings");
    return { success: true };
}
