"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";
import { updatePassword, deleteAccount } from "@/features/account/actions";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export function AccountView({ email }: { email: string }) {
    const { t } = useLanguage();
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();

    async function handlePasswordSubmit(formData: FormData) {
        setPasswordError(null);
        setPasswordSuccess(false);

        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (newPassword !== confirmPassword) {
            setPasswordError(t("account.passwordMismatch") || "Passwords do not match");
            return;
        }

        startTransition(async () => {
            const result = await updatePassword(formData);
            if (result.error) {
                setPasswordError(result.error);
            } else {
                setPasswordSuccess(true);
            }
        });
    }

    function handleDelete() {
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }
        startTransition(async () => {
            await deleteAccount();
        });
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card border-b h-16 flex items-center px-4 sm:px-6 justify-between sticky top-0 z-20 shadow-sm">
                <h1 className="text-lg font-bold tracking-tight">
                    {t("account.title") || "Account"}
                </h1>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <LanguageSwitcher />
                    <Link href="/">
                        <Button variant="outline" size="sm">
                            {t("account.backToDashboard") || "Back to Dashboard"}
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("account.email") || "Email Address"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{email}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("account.changePassword") || "Change Password"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form action={handlePasswordSubmit} className="space-y-4">
                            {passwordError && (
                                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                                    {passwordError}
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
                                    {t("account.passwordUpdated") || "Password updated successfully!"}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">
                                    {t("account.newPassword") || "New Password"}
                                </Label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">
                                    {t("account.confirmPassword") || "Confirm Password"}
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    disabled={isPending}
                                />
                            </div>
                            <Button type="submit" disabled={isPending}>
                                {isPending
                                    ? (t("account.updating") || "Updating...")
                                    : (t("account.updatePassword") || "Update Password")}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-destructive">
                            {t("account.dangerZone") || "Danger Zone"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {t("account.deleteAccountDesc") || "Permanently delete your account and all associated data. This action cannot be undone."}
                        </p>
                        {deleteConfirm && (
                            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded text-sm">
                                {t("account.deleteConfirm") || "Are you sure? This action is permanent."}
                            </div>
                        )}
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isPending}
                        >
                            {t("account.deleteAccount") || "Delete Account"}
                        </Button>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
