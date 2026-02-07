import { requireOrganization } from "@/lib/supabase-server";
import { getOrganization } from "@/features/settings/actions";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";

export default async function OnboardingPage() {
    await requireOrganization();
    const org = await getOrganization();

    return <OnboardingWizard orgName={org?.name || "Your Organization"} />;
}
