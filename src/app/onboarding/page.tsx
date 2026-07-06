import { requireOrganization } from "@/lib/supabase-server";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";

export default async function OnboardingPage() {
    const userOrg = await requireOrganization();

    return <OnboardingWizard orgName={userOrg.organizations?.name || "Your Organization"} />;
}
