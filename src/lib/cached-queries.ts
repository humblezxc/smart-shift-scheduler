import "server-only";
import { unstable_cache } from "next/cache";
import { getAdminClient, cacheTags } from "./supabase-admin";

const CACHE_TTL_SECONDS = 300;

export function fetchEmployeesForOrg(orgId: string, includeArchived = false) {
    const tag = cacheTags.employees(orgId);
    return unstable_cache(
        async () => {
            const supabase = getAdminClient();
            let query = supabase
                .from("employees")
                .select("*")
                .eq("organization_id", orgId)
                .order("first_name");

            if (!includeArchived) {
                query = query.is("archived_at", null);
            }

            const { data, error } = await query;
            if (error) return [];
            return data || [];
        },
        [`employees`, orgId, includeArchived ? "all" : "active"],
        { tags: [tag], revalidate: CACHE_TTL_SECONDS }
    )();
}

export function fetchArchivedEmployeesForOrg(orgId: string) {
    const tag = cacheTags.employees(orgId);
    return unstable_cache(
        async () => {
            const supabase = getAdminClient();
            const { data, error } = await supabase
                .from("employees")
                .select("*")
                .eq("organization_id", orgId)
                .not("archived_at", "is", null)
                .order("archived_at", { ascending: false });
            if (error) return [];
            return data || [];
        },
        [`employees`, orgId, "archived"],
        { tags: [tag], revalidate: CACHE_TTL_SECONDS }
    )();
}

export function fetchHolidaysForRange(orgId: string, startStr: string, endStr: string) {
    const tag = cacheTags.holidays(orgId);
    return unstable_cache(
        async () => {
            const supabase = getAdminClient();
            const { data, error } = await supabase
                .from("holidays")
                .select("date, name")
                .eq("organization_id", orgId)
                .gte("date", startStr)
                .lte("date", endStr);
            if (error) return [];
            return data || [];
        },
        [`holidays`, orgId, startStr, endStr],
        { tags: [tag], revalidate: CACHE_TTL_SECONDS }
    )();
}
