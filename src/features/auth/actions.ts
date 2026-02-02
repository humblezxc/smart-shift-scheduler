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

    const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
            name: organizationName,
            slug: `${slug}-${Date.now()}`,
        })
        .select()
        .single();

    if (orgError) {
        console.error("Org creation error:", orgError);
        return { error: "Failed to create organization" };
    }

    await supabase
        .from("organization_settings")
        .insert({ organization_id: org.id });

    const { error: linkError } = await supabase
        .from("user_organizations")
        .insert({
            user_id: authData.user.id,
            organization_id: org.id,
            role: "owner",
        });

    if (linkError) {
        console.error("Link error:", linkError);
        return { error: "Failed to link user to organization" };
    }

    redirect("/");
}

export async function logout() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    redirect("/login");
}
