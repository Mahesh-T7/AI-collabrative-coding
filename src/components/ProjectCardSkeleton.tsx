import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ProjectCardSkeleton = () => {
    return (
        <Card className="p-6 bg-card/50 backdrop-blur-sm">
            <div className="flex items-start gap-3">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex -space-x-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                </div>
                <Skeleton className="w-8 h-8 rounded-md" />
            </div>
        </Card>
    );
};
