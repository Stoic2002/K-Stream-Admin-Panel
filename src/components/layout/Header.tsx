import { useAuthStore } from '../../stores/authStore';

export const Header = () => {
    const user = useAuthStore((state) => state.user);

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-6">
            <div className="flex items-center gap-4">
                {/* Breadcrumb placeholer or search could go here */}
                <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                        {user?.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-medium text-gray-700">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-gray-500">{user?.role || 'Administrator'}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};
