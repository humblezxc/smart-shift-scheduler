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
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Invite Not Found
                    </h2>
                    <p className="text-gray-600">
                        This invite link is invalid or has been deleted.
                    </p>
                </div>
            );
        }

        if (invite.status === "revoked") {
            return (
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Invite Revoked
                    </h2>
                    <p className="text-gray-600">
                        This invite has been revoked by the organization admin.
                    </p>
                </div>
            );
        }

        if (invite.status === "expired") {
            return (
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                        <Clock className="h-8 w-8 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Invite Expired
                    </h2>
                    <p className="text-gray-600">
                        This invite has expired. Please request a new invite from the
                        organization admin.
                    </p>
                </div>
            );
        }

        if (invite.status === "accepted") {
            return (
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        Invite Already Accepted
                    </h2>
                    <p className="text-gray-600">
                        This invite has already been accepted.
                    </p>
                    <a
                        href="/login"
                        className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
                    <h2 className="text-xl font-semibold text-gray-900">
                        Join {invite.organization_name}
                    </h2>
                    <p className="text-gray-600 text-sm">
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
