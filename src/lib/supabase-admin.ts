import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
    if (adminClient) return adminClient;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error("Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }

    adminClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    return adminClient;
}

export const cacheTags = {
    employees: (orgId: string) => `employees:${orgId}`,
    holidays: (orgId: string) => `holidays:${orgId}`,
    shifts: (orgId: string) => `shifts:${orgId}`,
    settings: (orgId: string) => `settings:${orgId}`,
};
