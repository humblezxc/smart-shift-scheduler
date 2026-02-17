import { LoginForm } from "@/features/auth/components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Smart Shift Scheduler</h1>
                    <h2 className="mt-6 text-xl text-muted-foreground">Sign in to your account</h2>
                </div>

                <div className="bg-card p-8 rounded-lg shadow">
                    <Suspense fallback={<div>Loading...</div>}>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
