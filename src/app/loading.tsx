export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}
