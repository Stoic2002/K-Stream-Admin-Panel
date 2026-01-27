import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="ml-64 flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
