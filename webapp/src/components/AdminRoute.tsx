import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

interface AdminRouteProps {
    children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
    const { user, isLoading, isAuthenticated } = useAppStore();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated || !user?.is_admin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
