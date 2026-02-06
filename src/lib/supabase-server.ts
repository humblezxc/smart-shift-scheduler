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

export async function getUser() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function getUserOrganization() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id, role, organizations(id, name, slug)')
        .eq('user_id', user.id)
        .single();

    return userOrg;
}

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
        redirect('/login');
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
