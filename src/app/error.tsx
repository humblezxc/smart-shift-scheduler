"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="text-6xl">&#x26A0;&#xFE0F;</div>
                <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
                <p className="text-muted-foreground">
                    {error.message || "An unexpected error occurred. Please try again."}
                </p>
                <div className="flex gap-3 justify-center">
                    <Button onClick={reset} variant="outline">
                        Try Again
                    </Button>
                    <Button onClick={() => (window.location.href = "/")}>
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
