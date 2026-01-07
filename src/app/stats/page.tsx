import { getDetailedStats } from "@/features/scheduler/actions";
import { StatsWrapperClient } from "@/features/scheduler/components/stats-wrapper-client";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
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