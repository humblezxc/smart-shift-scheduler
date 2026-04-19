import { redirect } from "next/navigation";
import { getDetailedStats } from "@/features/scheduler/actions";
import { requireOrganization } from "@/lib/supabase-server";
import { StatsWrapperClient } from "@/features/scheduler/components/stats-wrapper-client";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
    const userOrg = await requireOrganization();
    if (!["owner", "admin", "manager"].includes(userOrg.role)) {
        redirect("/");
    }

    const today = new Date();

    const [monthStats, allTimeStats] = await Promise.all([
        getDetailedStats('month', today),
        getDetailedStats('all', today)
    ]);

    return (
        <StatsWrapperClient
            monthStats={monthStats}
            allTimeStats={allTimeStats}
            today={today}
        />
    );
}
