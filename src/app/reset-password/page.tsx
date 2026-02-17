"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { createBrowserClient } from "@supabase/ssr";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError(t("auth.passwordMismatch") || "Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setDone(true);
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Smart Shift Scheduler</h1>
                    <h2 className="mt-6 text-xl text-muted-foreground">
                        {t("auth.resetPasswordTitle") || "Set new password"}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {t("auth.resetPasswordDesc") || "Enter your new password below."}
                    </p>
                </div>

                <div className="bg-card p-8 rounded-lg shadow">
                    {done ? (
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                                {t("auth.passwordUpdated") || "Password updated successfully!"}
                            </div>
                            <Link href="/">
                                <Button className="w-full">
                                    {t("onboarding.goToDashboard") || "Go to Dashboard"}
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    {t("auth.newPassword") || "New Password"}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">
                                    {t("auth.confirmPassword") || "Confirm Password"}
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading
                                    ? (t("auth.updating") || "Updating...")
                                    : (t("auth.updatePassword") || "Update Password")}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
