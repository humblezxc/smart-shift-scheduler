import { cache } from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                    }
                },
            },
        }
    );
}

export const getUser = cache(async () => {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
});

export const getUserOrganization = cache(async () => {
    const user = await getUser();
    if (!user) return null;

    const supabase = await createSupabaseServerClient();
    const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id, role, organizations:organizations(id, name, slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (!userOrg) return null;

    const org = Array.isArray(userOrg.organizations) ? userOrg.organizations[0] : userOrg.organizations;
    return {
        organization_id: userOrg.organization_id,
        role: userOrg.role,
        organizations: org ?? null,
    };
});

export const getOrgSettings = cache(async (orgId: string) => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('organization_settings')
        .select('timezone, currency, week_starts_on, onboarding_completed')
        .eq('organization_id', orgId)
        .maybeSingle();
    if (error) {
        throw new Error('Failed to load organization settings');
    }
    return data;
});

export async function requireAuth() {
    const user = await getUser();
    if (!user) {
        redirect('/login');
    }
    return user;
}

export async function requireOrganization() {
    const user = await getUser();
    if (!user) {
        redirect('/login');
    }

    const userOrg = await getUserOrganization();
    if (!userOrg) {
        redirect('/setup-org');
    }
    return userOrg;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'viewer';

const ROLE_HIERARCHY: Record<UserRole, number> = {
    owner: 4,
    admin: 3,
    manager: 2,
    viewer: 1,
};

export function hasPermission(userRole: string, requiredRole: UserRole): boolean {
    const userLevel = ROLE_HIERARCHY[userRole as UserRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole];
    return userLevel >= requiredLevel;
}

export async function requireRole(requiredRole: UserRole) {
    const userOrg = await requireOrganization();

    if (!hasPermission(userOrg.role, requiredRole)) {
        return { error: `Permission denied. Required role: ${requiredRole}`, userOrg: null };
    }

    return { error: null, userOrg };
}

export async function checkRole(requiredRole: UserRole): Promise<{ allowed: boolean; userOrg: Awaited<ReturnType<typeof getUserOrganization>> }> {
    const userOrg = await getUserOrganization();

    if (!userOrg) {
        return { allowed: false, userOrg: null };
    }

    return {
        allowed: hasPermission(userOrg.role, requiredRole),
        userOrg,
    };
}

export async function checkOnboardingStatus(orgId: string): Promise<{ needsOnboarding: boolean }> {
    const settings = await getOrgSettings(orgId);

    if (settings?.onboarding_completed) {
        return { needsOnboarding: false };
    }

    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('archived_at', null);

    return { needsOnboarding: (count ?? 0) === 0 };
}

export async function getOrgScheduleConfig(orgId: string) {
    const settings = await getOrgSettings(orgId);
    return {
        timezone: settings?.timezone || "UTC",
        weekStartsOn: (settings?.week_starts_on ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    };
}

export async function completeOnboarding() {
    const supabase = await createSupabaseServerClient();
    const userOrg = await getUserOrganization();
    if (!userOrg) return;

    await supabase
        .from('organization_settings')
        .update({ onboarding_completed: true })
        .eq('organization_id', userOrg.organization_id);
}
