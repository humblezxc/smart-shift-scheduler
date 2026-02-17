"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/language-context";
import {
    acceptInviteExistingUser,
    acceptInviteNewUser,
    InviteDetails,
} from "../actions";

type Mode = "new_user" | "logged_in_correct" | "logged_in_wrong";

interface Props {
    invite: InviteDetails;
    token: string;
    mode: Mode;
    currentUserEmail?: string;
}

export function AcceptInviteForm({ invite, token, mode, currentUserEmail }: Props) {
    const { t } = useLanguage();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState("");

    const handleAcceptExisting = () => {
        setError(null);
        startTransition(async () => {
            const result = await acceptInviteExistingUser(token);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    const handleAcceptNew = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await acceptInviteNewUser(formData);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    if (mode === "logged_in_wrong") {
        return (
            <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                    {t("team.inviteForDifferentEmail") ||
                        `This invite is for ${invite.email}, but you're logged in as ${currentUserEmail}.`}
                </p>
                <p className="text-sm text-muted-foreground">
                    {t("team.logoutToAccept") ||
                        "Please log out and sign in with the correct email, or create a new account."}
                </p>
                <div className="flex gap-3 justify-center">
                    <Button variant="outline" asChild>
                        <a href="/login">{t("common.logout") || "Logout"}</a>
                    </Button>
                </div>
            </div>
        );
    }

    if (mode === "logged_in_correct") {
        return (
            <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                    {t("team.joinAsRole") ||
                        `You've been invited to join as a ${invite.role}.`}
                </p>
                {error && (
                    <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
                <Button
                    onClick={handleAcceptExisting}
                    disabled={isPending}
                    className="w-full"
                >
                    {isPending
                        ? t("common.loading") || "Loading..."
                        : t("team.acceptInvite") || "Accept Invite"}
                </Button>
            </div>
        );
    }

    // New user signup
    return (
        <form onSubmit={handleAcceptNew} className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">
                {t("team.createAccountToJoin") ||
                    "Create an account to join the team."}
            </p>

            {error && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm">
                    {error}
                </div>
            )}

            <input type="hidden" name="token" value={token} />

            <div className="space-y-2">
                <Label htmlFor="email">{t("forms.email") || "Email"}</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={invite.email}
                    readOnly
                    className="bg-muted"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">{t("forms.password") || "Password"}</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("forms.passwordPlaceholder") || "At least 6 characters"}
                    required
                    minLength={6}
                />
            </div>

            <Button type="submit" disabled={isPending} className="w-full">
                {isPending
                    ? t("common.loading") || "Loading..."
                    : t("team.createAccountAndJoin") || "Create Account & Join"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
                {t("team.alreadyHaveAccount") || "Already have an account?"}{" "}
                <a href="/login" className="text-primary hover:underline">
                    {t("common.login") || "Log in"}
                </a>
            </p>
        </form>
    );
}
