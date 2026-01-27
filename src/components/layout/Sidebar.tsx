import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import {
    LayoutDashboard,
    Film,
    Users,
    Tags,
    UserSquare2,
    LogOut
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Film, label: 'Dramas', path: '/dramas' },
    { icon: Tags, label: 'Genres', path: '/genres' },
    { icon: UserSquare2, label: 'Actors', path: '/actors' },
    { icon: Users, label: 'Users', path: '/users' },
];

export const Sidebar = () => {
    const location = useLocation();
    const logout = useAuthStore((state) => state.logout);

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
            <div className="flex h-16 items-center justify-center border-b border-gray-200">
                <h1 className="text-xl font-bold text-primary-600">Drakor Admin</h1>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-gray-200 p-4">
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
};
