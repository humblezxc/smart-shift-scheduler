"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
    organizationName: z.string().min(2, "Organization name required"),
});

export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const redirectTo = formData.get("redirect") as string || "/";

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    redirect(redirectTo);
}

export async function signup(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const organizationName = formData.get("organizationName") as string;

    const result = signupSchema.safeParse({ email, password, organizationName });
    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const supabase = await createSupabaseServerClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        return { error: authError.message };
    }

    if (!authData.user) {
        return { error: "Failed to create user" };
    }

    const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const { data: orgId, error: orgError } = await supabase
        .rpc("create_organization_with_owner", {
            org_name: organizationName,
            org_slug: `${slug}-${Date.now()}`,
            owner_user_id: authData.user.id,
        });

    if (orgError) {
        return { error: "Failed to create organization" };
    }

    redirect("/");
}

export async function logout() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login");
}
