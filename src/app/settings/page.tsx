import { getOrganization, getOrganizationSettings } from "@/features/settings/actions";
import { SettingsForm } from "@/features/settings/components/settings-form";

export default async function SettingsPage() {
    const [organization, settings] = await Promise.all([
        getOrganization(),
        getOrganizationSettings(),
    ]);

    return <SettingsForm organization={organization} settings={settings} />;
}
