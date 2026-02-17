import { getUser } from "@/lib/supabase-server";
import { getInviteByToken } from "@/features/team/actions";
import { AcceptInviteForm } from "@/features/team/components/accept-invite-form";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface Props {
    params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
    const { token } = await params;
    const invite = await getInviteByToken(token);
    const user = await getUser();

    const renderContent = () => {
        if (!invite || invite.status === "not_found") {
            return (
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                        Invite Not Found
                    </h2>
                    <p className="text-muted-foreground">
                        This invite link is invalid or has been deleted.
                    </p>
                </div>
            );
        }

        if (invite.status === "revoked") {
            return (
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                        Invite Revoked
                    </h2>
                    <p className="text-muted-foreground">
                        This invite has been revoked by the organization admin.
                    </p>
                </div>
            );
        }

        if (invite.status === "expired") {
            return (
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-950/50 rounded-full flex items-center justify-center">
                        <Clock className="h-8 w-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                        Invite Expired
                    </h2>
                    <p className="text-muted-foreground">
                        This invite has expired. Please request a new invite from the
                        organization admin.
                    </p>
                </div>
            );
        }

        if (invite.status === "accepted") {
            return (
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                        Invite Already Accepted
                    </h2>
                    <p className="text-muted-foreground">
                        This invite has already been accepted.
                    </p>
                    <a
                        href="/login"
                        className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        Go to Login
                    </a>
                </div>
            );
        }

        // Valid invite - determine the mode
        let mode: "new_user" | "logged_in_correct" | "logged_in_wrong" = "new_user";

        if (user) {
            if (user.email?.toLowerCase() === invite.email.toLowerCase()) {
                mode = "logged_in_correct";
            } else {
                mode = "logged_in_wrong";
            }
        }

        return (
            <>
                <div className="text-center space-y-2 mb-6">
                    <h2 className="text-xl font-semibold text-foreground">
                        Join {invite.organization_name}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        You&apos;ve been invited to join as <span className="font-medium capitalize">{invite.role}</span>
                    </p>
                </div>
                <AcceptInviteForm
                    invite={invite}
                    token={token}
                    mode={mode}
                    currentUserEmail={user?.email}
                />
            </>
        );
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-lg shadow-md border p-6 sm:p-8">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
