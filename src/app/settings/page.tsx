import { getOrganization, getOrganizationSettings } from "@/features/settings/actions";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { listInvites, getCurrentUserRole, listTeamMembers } from "@/features/team/actions";
import { TeamSettingsSection } from "@/features/team/components/team-settings-section";
import { getUser } from "@/lib/supabase-server";
import { getArchivedEmployees } from "@/features/employees/actions";
import { ArchivedEmployeesSection } from "@/features/employees/components/archived-employees-section";

export default async function SettingsPage() {
    const [organization, settings, invites, userRole, teamMembers, user, archivedEmployees] = await Promise.all([
        getOrganization(),
        getOrganizationSettings(),
        listInvites(),
        getCurrentUserRole(),
        listTeamMembers(),
        getUser(),
        getArchivedEmployees(),
    ]);

    const canEditSettings = userRole === 'owner' || userRole === 'admin';

    return (
        <SettingsForm
            organization={organization}
            settings={settings}
            canEdit={canEditSettings}
            teamSection={
                <>
                    <TeamSettingsSection
                        invites={invites}
                        userRole={userRole}
                        teamMembers={teamMembers}
                        currentUserId={user?.id}
                    />
                    <ArchivedEmployeesSection
                        employees={archivedEmployees}
                        canManage={canEditSettings}
                    />
                </>
            }
        />
    );
}
