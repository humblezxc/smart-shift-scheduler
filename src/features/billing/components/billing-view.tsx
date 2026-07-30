"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";
import { createCheckoutSession, createPortalSession } from "@/features/billing/actions";
import { TIER_LIMITS, SubscriptionTier } from "@/lib/stripe";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Suspense } from "react";

interface BillingInfo {
    tier: SubscriptionTier;
    status: string;
    hasStripe: boolean;
    employeeCount: number;
    organizationId: string;
    stripeConfigured: boolean;
}

function BillingContent({ billingInfo }: { billingInfo: BillingInfo }) {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const limit = TIER_LIMITS[billingInfo.tier].maxEmployees;

    async function handleUpgrade() {
        startTransition(async () => {
            const result = await createCheckoutSession();
            if (result.url) {
                window.location.href = result.url;
            }
        });
    }

    async function handleManageBilling() {
        startTransition(async () => {
            const result = await createPortalSession();
            if (result.url) {
                window.location.href = result.url;
            }
        });
    }

    return (
        <main className="max-w-2xl mx-auto p-4 sm:p-8 space-y-6">
            {success && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
                    {t("billing.upgradeSuccess") || "Successfully upgraded!"}
                </div>
            )}
            {canceled && (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded">
                    {t("billing.upgradeCanceled") || "Upgrade canceled."}
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{t("billing.currentPlan") || "Current Plan"}</CardTitle>
                        <Badge variant={billingInfo.tier === "free" ? "secondary" : "default"}>
                            {billingInfo.tier.toUpperCase()}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                            {t("billing.usage") || "Usage"}
                        </p>
                        <p className="text-lg">
                            {billingInfo.employeeCount} {t("billing.employeesUsed") || "employees used"}{" "}
                            {t("billing.of") || "of"}{" "}
                            {billingInfo.tier === "free" ? limit : (t("billing.unlimited") || "unlimited")}
                        </p>
                        {billingInfo.tier === "free" && (
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                                <div
                                    className="bg-primary rounded-full h-2 transition-all"
                                    style={{ width: `${Math.min((billingInfo.employeeCount / limit) * 100, 100)}%` }}
                                />
                            </div>
                        )}
                    </div>

                    {!billingInfo.stripeConfigured && (
                        <p className="text-sm text-muted-foreground">
                            {t("billing.stripeNotConfigured") || "Billing is not yet configured."}
                        </p>
                    )}

                    {billingInfo.stripeConfigured && billingInfo.tier === "free" && (
                        <Button onClick={handleUpgrade} disabled={isPending}>
                            {t("billing.upgrade") || "Upgrade to Pro"}
                        </Button>
                    )}

                    {billingInfo.stripeConfigured && billingInfo.hasStripe && (
                        <Button variant="outline" onClick={handleManageBilling} disabled={isPending}>
                            {t("billing.manageBilling") || "Manage Billing"}
                        </Button>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    {
                        name: t("landing.free") || "Free",
                        price: "$0",
                        features: [
                            t("landing.freeFeature1") || "Up to 15 employees",
                            t("landing.freeFeature2") || "AI schedule generation",
                            t("landing.freeFeature3") || "PDF exports",
                        ],
                        current: billingInfo.tier === "free",
                    },
                    {
                        name: t("landing.pro") || "Pro",
                        price: t("landing.proPrice") || "$19/mo",
                        features: [
                            t("landing.proFeature1") || "Unlimited employees",
                            t("landing.proFeature2") || "Priority support",
                            t("landing.proFeature3") || "Custom shift templates",
                        ],
                        current: billingInfo.tier === "pro",
                    },
                    {
                        name: t("landing.business") || "Business",
                        price: t("landing.businessPrice") || "$49/mo",
                        features: [
                            t("landing.businessFeature1") || "Multiple locations",
                            t("landing.businessFeature2") || "Advanced analytics",
                            t("landing.businessFeature3") || "API access",
                        ],
                        current: billingInfo.tier === "business",
                    },
                ].map((plan) => (
                    <Card key={plan.name} className={plan.current ? "border-primary" : ""}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{plan.name}</CardTitle>
                                {plan.current && <Badge>Active</Badge>}
                            </div>
                            <p className="text-2xl font-bold">{plan.price}</p>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-1">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="text-sm flex items-center gap-2">
                                        <span className="text-green-600">&#10003;</span> {f}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </main>
    );
}

export function BillingView({ billingInfo }: { billingInfo: BillingInfo }) {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card border-b h-16 flex items-center px-4 sm:px-6 justify-between sticky top-0 z-20 shadow-sm">
                <h1 className="text-lg font-bold tracking-tight">
                    {t("billing.title") || "Billing"}
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
            <Suspense>
                <BillingContent billingInfo={billingInfo} />
            </Suspense>
        </div>
    );
}
