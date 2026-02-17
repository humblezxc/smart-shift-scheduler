import { redirect } from "next/navigation";
import { getUser, getUserOrganization } from "@/lib/supabase-server";
import { SetupOrgForm } from "./setup-org-form";

export default async function SetupOrgPage() {
    const user = await getUser();
    if (!user) {
        redirect("/login");
    }

    const userOrg = await getUserOrganization();
    if (userOrg) {
        redirect("/");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Smart Shift Scheduler</h1>
                    <h2 className="mt-6 text-xl text-muted-foreground">Create your organization</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Your account is ready. Set up your organization to get started.
                    </p>
                </div>

                <div className="bg-card p-8 rounded-lg shadow border">
                    <SetupOrgForm />
                </div>
            </div>
        </div>
    );
}
