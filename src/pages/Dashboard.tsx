import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Users, Film, PlayCircle, Eye } from 'lucide-react';
import { analyticsService } from '../services/analytics';
import type { DashboardStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '../components/ui/Skeleton';

export const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await analyticsService.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.total_users || 0,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            title: 'Total Dramas',
            value: stats?.total_dramas || 0,
            icon: Film,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
        {
            title: 'Total Episodes',
            value: stats?.total_episodes || 0,
            icon: PlayCircle,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            title: 'Total Views',
            value: stats?.total_views || 0,
            icon: Eye,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
        },
    ];

    // Mock data for chart for now until we have detailed analytics endpoint
    const chartData = [
        { name: 'Mon', views: 400 },
        { name: 'Tue', views: 300 },
        { name: 'Wed', views: 200 },
        { name: 'Thu', views: 278 },
        { name: 'Fri', views: 189 },
        { name: 'Sat', views: 239 },
        { name: 'Sun', views: 349 },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="flex items-center gap-4 p-6">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="col-span-1">
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent><Skeleton className="h-80 w-full rounded-md" /></CardContent>
                    </Card>
                    <Card className="col-span-1">
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent><Skeleton className="h-40 w-full rounded-md" /></CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                    <Card key={card.title}>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className={`rounded-xl p-3 ${card.bg}`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                                <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-800">Views Overview (Mock)</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="views" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-gray-500 text-sm">Modules implementation in progress...</p>
                            {/* Add quick action buttons here later */}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
