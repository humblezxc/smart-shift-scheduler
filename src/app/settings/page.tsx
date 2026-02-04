import { getOrganization, getOrganizationSettings } from "@/features/settings/actions";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { listInvites, getCurrentUserRole, listTeamMembers } from "@/features/team/actions";
import { TeamSettingsSection } from "@/features/team/components/team-settings-section";

export default async function SettingsPage() {
    const [organization, settings, invites, userRole, teamMembers] = await Promise.all([
        getOrganization(),
        getOrganizationSettings(),
        listInvites(),
        getCurrentUserRole(),
        listTeamMembers(),
    ]);

    const canEditSettings = userRole === 'owner' || userRole === 'admin';

    return (
        <SettingsForm
            organization={organization}
            settings={settings}
            canEdit={canEditSettings}
            teamSection={
                <TeamSettingsSection
                    invites={invites}
                    userRole={userRole}
                    teamMembers={teamMembers}
                />
            }
        />
    );
}
