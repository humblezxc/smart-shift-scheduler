"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/language-context";
import {
    createInvite,
    revokeInvite,
    OrganizationInvite,
    TeamRole,
    InviteRole,
    TeamMember,
} from "../actions";
import { Copy, Check, Trash2, Mail, UserPlus, Users, Crown, Shield, UserCog, Eye } from "lucide-react";

interface Props {
    invites: OrganizationInvite[];
    userRole: TeamRole | null;
    teamMembers: TeamMember[];
}

export function TeamSettingsSection({ invites, userRole, teamMembers }: Props) {
    const { t } = useLanguage();
    const [isPending, startTransition] = useTransition();
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<InviteRole>("viewer");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

    const canManageTeam = userRole === "owner" || userRole === "admin";

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "owner": return <Crown className="h-4 w-4 text-purple-500" />;
            case "admin": return <Shield className="h-4 w-4 text-blue-500" />;
            case "manager": return <UserCog className="h-4 w-4 text-amber-500" />;
            default: return <Eye className="h-4 w-4 text-gray-400" />;
        }
    };

    const handleCreateInvite = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await createInvite(formData);
            if (result.error) {
                setError(result.error);
            } else if (result.success && result.inviteUrl) {
                setSuccess(t("team.inviteSent") || "Invite created successfully!");
                setLastInviteUrl(result.inviteUrl);
                setEmail("");
                setRole("viewer");
            }
        });
    };

    const handleRevoke = (id: string) => {
        startTransition(async () => {
            const result = await revokeInvite(id);
            if (result.error) {
                setError(result.error);
            }
        });
    };

    const handleCopyUrl = async (invite: OrganizationInvite) => {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        const url = `${baseUrl}/invite/${invite.token}`;
        await navigator.clipboard.writeText(url);
        setCopiedId(invite.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCopyLastUrl = async () => {
        if (lastInviteUrl) {
            await navigator.clipboard.writeText(lastInviteUrl);
            setCopiedId("last");
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const formatRole = (role: string) => {
        const roleLabels: Record<string, string> = {
            owner: t("team.roles.owner") || "Owner",
            admin: t("team.roles.admin") || "Admin",
            manager: t("team.roles.manager") || "Manager",
            viewer: t("team.roles.viewer") || "Viewer",
        };
        return roleLabels[role] || role;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
    };

    if (!canManageTeam) {
        return null;
    }

    return (
        <section className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                    {t("team.title") || "Team Management"}
                </h2>
            </div>

            {/* Team Members */}
            {teamMembers.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        {t("team.members") || "Team Members"} ({teamMembers.length})
                    </h3>
                    <div className="space-y-2">
                        {teamMembers.map((member) => (
                            <div
                                key={member.user_id}
                                className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 text-sm"
                            >
                                <div className="flex items-center gap-3">
                                    {getRoleIcon(member.role)}
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {member.email}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {formatRole(member.role)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Form */}
            <form onSubmit={handleCreateInvite} className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <UserPlus className="h-4 w-4" />
                    {t("team.inviteMember") || "Invite a new team member"}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                        <div className="flex items-center justify-between">
                            <span>{success}</span>
                            {lastInviteUrl && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopyLastUrl}
                                    className="ml-2"
                                >
                                    {copiedId === "last" ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,auto] gap-3">
                    <div className="space-y-1">
                        <Label htmlFor="invite-email" className="text-sm">
                            {t("forms.email") || "Email"}
                        </Label>
                        <Input
                            id="invite-email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="invite-role" className="text-sm">
                            {t("forms.role") || "Role"}
                        </Label>
                        <Select
                            name="role"
                            value={role}
                            onValueChange={(v) => setRole(v as InviteRole)}
                        >
                            <SelectTrigger id="invite-role" className="w-[130px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">{formatRole("admin")}</SelectItem>
                                <SelectItem value="manager">{formatRole("manager")}</SelectItem>
                                <SelectItem value="viewer">{formatRole("viewer")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button type="submit" disabled={isPending}>
                            <Mail className="h-4 w-4 mr-2" />
                            {isPending
                                ? t("common.loading") || "..."
                                : t("team.sendInvite") || "Invite"}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Pending Invites */}
            {invites.length > 0 && (
                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                        {t("team.pendingInvites") || "Pending Invites"} ({invites.length})
                    </h3>
                    <div className="space-y-2">
                        {invites.map((invite) => (
                            <div
                                key={invite.id}
                                className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 text-sm"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                        {invite.email}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatRole(invite.role)} &middot; {t("team.expires") || "Expires"}{" "}
                                        {formatDate(invite.expires_at)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopyUrl(invite)}
                                        title={t("team.copyLink") || "Copy invite link"}
                                    >
                                        {copiedId === invite.id ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRevoke(invite.id)}
                                        disabled={isPending}
                                        title={t("team.revokeInvite") || "Revoke invite"}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Role Descriptions */}
            <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                    {t("team.rolePermissions") || "Role Permissions"}
                </h3>
                <div className="text-xs text-gray-500 space-y-1">
                    <p>
                        <span className="font-medium">{formatRole("admin")}:</span>{" "}
                        {t("team.adminDesc") || "Manage team, settings, all schedules"}
                    </p>
                    <p>
                        <span className="font-medium">{formatRole("manager")}:</span>{" "}
                        {t("team.managerDesc") || "Create/edit shifts, manage employees"}
                    </p>
                    <p>
                        <span className="font-medium">{formatRole("viewer")}:</span>{" "}
                        {t("team.viewerDesc") || "View-only access to dashboard"}
                    </p>
                </div>
            </div>
        </section>
    );
}
