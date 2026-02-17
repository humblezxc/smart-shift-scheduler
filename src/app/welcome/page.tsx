"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL;
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
    return (
        <Card className="border border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
                <div className="text-3xl mb-2">{icon}</div>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

function PricingCard({ name, price, description, features, highlight, badge }: {
    name: string;
    price: string;
    description: string;
    features: string[];
    highlight?: boolean;
    badge: string;
}) {
    return (
        <Card className={`relative ${highlight ? "border-2 border-primary shadow-lg scale-105" : "border border-border"}`}>
            {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                </div>
            )}
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{name}</CardTitle>
                <div className="text-3xl font-bold mt-2">{price}</div>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
                <ul className="space-y-2">
                    {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="text-green-600 font-bold">&#10003;</span>
                            {feature}
                        </li>
                    ))}
                </ul>
                <Button
                    variant={highlight ? "default" : "outline"}
                    className="w-full mt-4"
                    disabled={!highlight && badge !== "Current Plan"}
                >
                    {badge}
                </Button>
            </CardContent>
        </Card>
    );
}

export default function WelcomePage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card border-b sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <span className="text-lg font-bold tracking-tight">Smart Shift Scheduler</span>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <LanguageSwitcher />
                        <Link href="/login">
                            <Button variant="ghost" size="sm">
                                {t("landing.login") || "Sign In"}
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button size="sm">
                                {t("landing.signUp") || "Get Started Free"}
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <section className="py-20 sm:py-32 px-4">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                        {t("landing.hero") || "Smart Shift Scheduling for Retail Teams"}
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t("landing.heroDesc") || "AI-powered workforce management platform. Generate optimized schedules, manage your team, and export reports."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        {DEMO_EMAIL && DEMO_PASSWORD && (
                            <Link href="/login">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
                                    {t("landing.tryDemo") || "Try Demo"}
                                </Button>
                            </Link>
                        )}
                        <Link href="/signup">
                            <Button size="lg" className="w-full sm:w-auto text-base px-8">
                                {t("landing.signUp") || "Get Started Free"}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-16 sm:py-24 px-4 bg-card">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        {t("landing.featuresTitle") || "Everything you need to manage shifts"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon="&#x1F9E0;"
                            title={t("landing.feature1") || "AI Schedule Generation"}
                            description={t("landing.feature1Desc") || "Automatically generate optimized weekly schedules."}
                        />
                        <FeatureCard
                            icon="&#x1F5B1;&#xFE0F;"
                            title={t("landing.feature2") || "Drag & Drop Editor"}
                            description={t("landing.feature2Desc") || "Easily adjust shifts with an intuitive interface."}
                        />
                        <FeatureCard
                            icon="&#x1F465;"
                            title={t("landing.feature3") || "Team Management"}
                            description={t("landing.feature3Desc") || "Invite team members and manage permissions."}
                        />
                        <FeatureCard
                            icon="&#x1F4C4;"
                            title={t("landing.feature4") || "PDF Export"}
                            description={t("landing.feature4Desc") || "Export schedules and timesheets as PDF documents."}
                        />
                        <FeatureCard
                            icon="&#x1F4F1;"
                            title={t("landing.feature5") || "Employee Portal"}
                            description={t("landing.feature5Desc") || "Personal schedule links with time-off requests."}
                        />
                        <FeatureCard
                            icon="&#x1F30D;"
                            title={t("landing.feature6") || "Multi-language"}
                            description={t("landing.feature6Desc") || "Full support for English, Polish, and Ukrainian."}
                        />
                    </div>
                </div>
            </section>

            <section className="py-16 sm:py-24 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        {t("landing.pricingTitle") || "Simple, transparent pricing"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        <PricingCard
                            name={t("landing.free") || "Free"}
                            price="$0"
                            description={t("landing.freeDesc") || "For small teams getting started"}
                            features={[
                                t("landing.freeFeature1") || "Up to 5 employees",
                                t("landing.freeFeature2") || "AI schedule generation",
                                t("landing.freeFeature3") || "PDF exports",
                            ]}
                            badge={t("landing.currentPlan") || "Current Plan"}
                        />
                        <PricingCard
                            name={t("landing.pro") || "Pro"}
                            price={t("landing.proPrice") || "$19/mo"}
                            description={t("landing.proDesc") || "For growing businesses"}
                            features={[
                                t("landing.proFeature1") || "Unlimited employees",
                                t("landing.proFeature2") || "Priority support",
                                t("landing.proFeature3") || "Custom shift templates",
                            ]}
                            highlight
                            badge={t("landing.comingSoon") || "Coming Soon"}
                        />
                        <PricingCard
                            name={t("landing.business") || "Business"}
                            price={t("landing.businessPrice") || "$49/mo"}
                            description={t("landing.businessDesc") || "For multi-location franchises"}
                            features={[
                                t("landing.businessFeature1") || "Multiple locations",
                                t("landing.businessFeature2") || "Advanced analytics",
                                t("landing.businessFeature3") || "API access",
                            ]}
                            badge={t("landing.comingSoon") || "Coming Soon"}
                        />
                    </div>
                </div>
            </section>

            <footer className="border-t bg-card py-8 px-4">
                <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
                    <p>{t("landing.footerText") || "Built with Next.js, TypeScript, and Supabase"}</p>
                </div>
            </footer>
        </div>
    );
}
