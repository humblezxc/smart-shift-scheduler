"use server";

import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({
    organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
});

export async function setupOrganization(formData: FormData) {
    const user = await getUser();
    if (!user) {
        return { error: "Not authenticated" };
    }

    const organizationName = formData.get("organizationName") as string;
    const result = schema.safeParse({ organizationName });
    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.rpc("create_organization_with_owner", {
        org_name: organizationName,
        org_slug: `${slug}-${Date.now()}`,
        owner_user_id: user.id,
    });

    if (error) {
        return { error: "Failed to create organization" };
    }

    redirect("/onboarding");
}
