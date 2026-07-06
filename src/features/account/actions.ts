"use server";

import { createSupabaseServerClient, getUser, getUserOrganization } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function updatePassword(formData: FormData) {
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!newPassword || newPassword.length < 6) {
        return { error: "Password must be at least 6 characters" };
    }

    if (newPassword !== confirmPassword) {
        return { error: "Passwords do not match" };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function deleteAccount() {
    const user = await getUser();
    if (!user) {
        return { error: "Not authenticated" };
    }

    const userOrg = await getUserOrganization();
    const supabase = await createSupabaseServerClient();

    const { error: orgError, count } = await supabase
        .from("user_organizations")
        .delete({ count: "exact" })
        .eq("user_id", user.id);

    if (orgError || (userOrg && !count)) {
        return { error: "Failed to remove organization membership" };
    }

    await supabase.auth.signOut();
    redirect("/welcome");
}

export async function getAccountInfo() {
    const user = await getUser();
    if (!user) {
        redirect("/login");
    }
    return { email: user.email || "" };
}
