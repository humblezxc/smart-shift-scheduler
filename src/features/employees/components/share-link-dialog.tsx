"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Link2, ShieldAlert, RefreshCcw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/context/language-context";
import { rotateEmployeeShareLink, revokeEmployeeShareLinks } from "../actions";

interface Props {
    employeeId: number;
    employeeName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShareLinkDialog({ employeeId, employeeName, open, onOpenChange }: Props) {
    const { t, language } = useLanguage();
    const [token, setToken] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [loading, setLoading] = useState<"idle" | "rotating" | "revoking">("idle");
    const [copied, setCopied] = useState(false);

    const title = t("share.title") !== "share.title" ? t("share.title") : "Share Link";
    const generateLabel = t("share.generate") !== "share.generate" ? t("share.generate") : "Generate new link";
    const rotateLabel = t("share.rotate") !== "share.rotate" ? t("share.rotate") : "Rotate (invalidate old)";
    const revokeLabel = t("share.revoke") !== "share.revoke" ? t("share.revoke") : "Revoke all active links";
    const copyLabel = t("share.copy") !== "share.copy" ? t("share.copy") : "Copy link";
    const copiedLabel = t("share.copied") !== "share.copied" ? t("share.copied") : "Copied";
    const warningLabel = t("share.warning") !== "share.warning"
        ? t("share.warning")
        : "Copy this link now — it will not be shown again. Rotating invalidates the old link so anyone still holding it will lose access.";
    const revokedLabel = t("share.revoked") !== "share.revoked" ? t("share.revoked") : "All active links revoked";
    const rotatedLabel = t("share.rotated") !== "share.rotated" ? t("share.rotated") : "New link generated";

    const url = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${token}?lang=${language}` : null;

    async function onRotate() {
        setLoading("rotating");
        const res = await rotateEmployeeShareLink(employeeId);
        setLoading("idle");
        if (res.error) {
            toast.error(res.error);
            return;
        }
        if (res.success && res.token) {
            setToken(res.token);
            setExpiresAt(res.expiresAt ?? null);
            toast.success(rotatedLabel);
        }
    }

    async function onRevoke() {
        setLoading("revoking");
        const res = await revokeEmployeeShareLinks(employeeId);
        setLoading("idle");
        if (res.error) {
            toast.error(res.error);
            return;
        }
        setToken(null);
        setExpiresAt(null);
        toast.success(revokedLabel);
    }

    async function onCopy() {
        if (!url) return;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success(copiedLabel);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    setToken(null);
                    setExpiresAt(null);
                    setCopied(false);
                }
                onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link2 className="w-4 h-4" /> {title} — {employeeName}
                    </DialogTitle>
                    <DialogDescription>
                        {t("share.description") !== "share.description"
                            ? t("share.description")
                            : "Personal schedule link for this employee. Tokens are stored hashed, expire automatically, and can be rotated or revoked at any time."}
                    </DialogDescription>
                </DialogHeader>

                {!token ? (
                    <div className="flex flex-col gap-3 py-2">
                        <p className="text-sm text-muted-foreground">
                            {t("share.no_link_hint") !== "share.no_link_hint"
                                ? t("share.no_link_hint")
                                : "Generating a link will invalidate any previously issued link for this employee."}
                        </p>
                        <Button onClick={onRotate} disabled={loading !== "idle"}>
                            <RefreshCcw className={`w-4 h-4 mr-2 ${loading === "rotating" ? "animate-spin" : ""}`} />
                            {generateLabel}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 py-2">
                        <div className="rounded-md border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3 flex gap-2 text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span className="text-amber-900 dark:text-amber-200">{warningLabel}</span>
                        </div>

                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={url ?? ""}
                                className="flex-1 font-mono text-xs px-3 py-2 rounded-md border bg-muted/50 select-all"
                                onFocus={(e) => e.currentTarget.select()}
                            />
                            <Button size="sm" variant="outline" onClick={onCopy}>
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>

                        {expiresAt && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                {t("share.expires_at") !== "share.expires_at" ? t("share.expires_at") : "Expires"} {format(new Date(expiresAt), "MMM d, yyyy HH:mm")}
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        onClick={onRevoke}
                        disabled={loading !== "idle"}
                    >
                        {revokeLabel}
                    </Button>
                    {token && (
                        <Button variant="outline" onClick={onRotate} disabled={loading !== "idle"}>
                            <RefreshCcw className={`w-4 h-4 mr-2 ${loading === "rotating" ? "animate-spin" : ""}`} />
                            {rotateLabel}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
