import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
        throw new Error('Unauthorized');
    }
    return user;
}

export async function requireOrganization() {
    const userOrg = await getUserOrganization();
    if (!userOrg) {
        throw new Error('No organization found');
    }
    return userOrg;
}
