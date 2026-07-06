"use server";

import { createSupabaseServerClient, requireOrganization, requireRole, getUser, getUserOrganization } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendEmail, buildInviteEmail } from "@/lib/email";

export type TeamRole = "owner" | "admin" | "manager" | "viewer";
export type InviteRole = "admin" | "manager" | "viewer";

export interface OrganizationInvite {
    id: string;
    organization_id: string;
    email: string;
    role: InviteRole;
    token: string;
    expires_at: string;
    accepted_at: string | null;
    revoked_at: string | null;
    created_at: string;
}

export interface TeamMember {
    user_id: string;
    role: TeamRole;
    created_at: string;
    email?: string;
}

const createInviteSchema = z.object({
    email: z.string().email("Invalid email address"),
    role: z.enum(["admin", "manager", "viewer"]),
});

export async function createInvite(formData: FormData) {
    const email = formData.get("email") as string;
    const role = formData.get("role") as InviteRole;

    const result = createInviteSchema.safeParse({ email, role });
    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) {
        return { error: "You don't have permission to invite team members" };
    }

    const user = await getUser();
    const supabase = await createSupabaseServerClient();

    const { data: existing, error: existingError } = await supabase
        .from("organization_invites")
        .select("id")
        .eq("organization_id", userOrg.organization_id)
        .eq("email", email.toLowerCase())
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();

    if (existingError) {
        return { error: "Failed to create invite" };
    }

    if (existing) {
        return { error: "An invite for this email is already pending" };
    }

    const { data: invite, error } = await supabase
        .from("organization_invites")
        .insert({
            organization_id: userOrg.organization_id,
            email: email.toLowerCase(),
            role,
            invited_by: user?.id,
        })
        .select()
        .single();

    if (error) {
        return { error: "Failed to create invite" };
    }

    revalidatePath("/settings");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const inviteUrl = `${baseUrl}/invite/${invite.token}`;

    const emailContent = buildInviteEmail({
        organizationName: userOrg.organizations?.name || "your team",
        role,
        inviteUrl,
    });

    await sendEmail({
        to: email.toLowerCase(),
        ...emailContent,
    });

    return {
        success: true,
        inviteUrl,
        invite,
    };
}

export async function listInvites(): Promise<OrganizationInvite[]> {
    const userOrg = await requireOrganization();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("organization_invites")
        .select("*")
        .eq("organization_id", userOrg.organization_id)
        .is("accepted_at", null)
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

    if (error) {
        return [];
    }

    return data || [];
}

export async function revokeInvite(id: string) {
    const { error: roleError, userOrg } = await requireRole('admin');
    if (roleError || !userOrg) {
        return { error: "You don't have permission to revoke invites" };
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
        .from("organization_invites")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id)
        .eq("organization_id", userOrg.organization_id);

    if (error) {
        return { error: "Failed to revoke invite" };
    }

    revalidatePath("/settings");
    return { success: true };
}

export interface InviteDetails {
    id: string;
    organization_id: string;
    organization_name: string;
    email: string;
    role: InviteRole;
    expires_at: string;
    accepted_at: string | null;
    revoked_at: string | null;
    status: "valid" | "expired" | "revoked" | "accepted" | "not_found";
}

interface InviteRpcResult {
    id: string;
    organization_id: string;
    organization_name: string;
    email: string;
    role: InviteRole;
    expires_at: string;
    accepted_at: string | null;
    revoked_at: string | null;
}

export async function getInviteByToken(token: string): Promise<InviteDetails | null> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .rpc("get_invite_by_token", { invite_token: token })
        .single<InviteRpcResult>();

    if (error || !data) {
        return {
            id: "",
            organization_id: "",
            organization_name: "",
            email: "",
            role: "viewer",
            expires_at: "",
            accepted_at: null,
            revoked_at: null,
            status: "not_found",
        };
    }

    let status: InviteDetails["status"] = "valid";
    if (data.revoked_at) {
        status = "revoked";
    } else if (data.accepted_at) {
        status = "accepted";
    } else if (new Date(data.expires_at) < new Date()) {
        status = "expired";
    }

    return {
        id: data.id,
        organization_id: data.organization_id,
        organization_name: data.organization_name,
        email: data.email,
        role: data.role,
        expires_at: data.expires_at,
        accepted_at: data.accepted_at,
        revoked_at: data.revoked_at,
        status,
    };
}

interface AcceptInviteResult {
    success: boolean;
    error?: string;
    organization_id?: string;
    role?: string;
}

export async function acceptInviteExistingUser(token: string) {
    const user = await getUser();
    if (!user) {
        return { error: "You must be logged in to accept an invite" };
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .rpc("accept_invite", {
            invite_token: token,
            accepting_user_id: user.id
        })
        .single<AcceptInviteResult>();

    if (error) {
        return { error: "Failed to accept invite" };
    }

    if (!data?.success) {
        return { error: data?.error || "Failed to accept invite" };
    }

    revalidatePath("/");
    redirect("/");
}

const acceptNewUserSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    token: z.string().min(1),
});

export async function acceptInviteNewUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const token = formData.get("token") as string;

    const result = acceptNewUserSchema.safeParse({ email, password, token });
    if (!result.success) {
        return { error: result.error.issues[0].message };
    }

    const invite = await getInviteByToken(token);
    if (!invite || invite.status !== "valid") {
        return { error: `This invite is ${invite?.status || "invalid"}` };
    }

    if (email.toLowerCase() !== invite.email.toLowerCase()) {
        return { error: "Email does not match the invite" };
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
        return { error: "Failed to create account" };
    }

    const { data, error } = await supabase
        .rpc("accept_invite", {
            invite_token: token,
            accepting_user_id: authData.user.id
        })
        .single<AcceptInviteResult>();

    if (error) {
        return { error: "Account created but failed to join organization" };
    }

    if (!data?.success) {
        return { error: data?.error || "Failed to join organization" };
    }

    redirect("/");
}

interface TeamMemberRpcResult {
    user_id: string;
    email: string;
    role: TeamRole;
    created_at: string;
}

export async function listTeamMembers(): Promise<TeamMember[]> {
    const userOrg = await requireOrganization();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .rpc("get_team_members", { org_id: userOrg.organization_id });

    if (error) {
        return [];
    }

    return (data as TeamMemberRpcResult[] || []).map(m => ({
        user_id: m.user_id,
        email: m.email,
        role: m.role,
        created_at: m.created_at,
    }));
}

export async function getCurrentUserRole(): Promise<TeamRole | null> {
    const userOrg = await getUserOrganization();
    return userOrg?.role as TeamRole || null;
}

export async function updateMemberRole(userId: string, newRole: InviteRole) {
    const userOrg = await requireOrganization();
    const currentUser = await getUser();
    if (!currentUser) return { error: "Not authenticated" };

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .rpc("update_member_role", {
            caller_user_id: currentUser.id,
            target_user_id: userId,
            target_org_id: userOrg.organization_id,
            new_role: newRole,
        })
        .single<{ success: boolean; error?: string }>();

    if (error) {
        return { error: "Failed to update member role" };
    }

    if (!data?.success) {
        return { error: data?.error || "Failed to update member role" };
    }

    revalidatePath("/settings");
    return { success: true };
}

export async function removeMember(userId: string) {
    const userOrg = await requireOrganization();
    const currentUser = await getUser();
    if (!currentUser) return { error: "Not authenticated" };

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .rpc("remove_org_member", {
            caller_user_id: currentUser.id,
            target_user_id: userId,
            target_org_id: userOrg.organization_id,
        })
        .single<{ success: boolean; error?: string }>();

    if (error) {
        return { error: "Failed to remove member" };
    }

    if (!data?.success) {
        return { error: data?.error || "Failed to remove member" };
    }

    revalidatePath("/settings");
    return { success: true };
}
