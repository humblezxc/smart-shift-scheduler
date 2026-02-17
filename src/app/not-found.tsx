import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="text-8xl font-bold text-muted">404</div>
                <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
                <p className="text-muted-foreground">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link href="/">
                    <Button>Go Home</Button>
                </Link>
            </div>
        </div>
    );
}
