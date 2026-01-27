import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userService } from '@/services/user';
import type { User } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

export const Users = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [pageTotal, setPageTotal] = useState(0);

    const page = Number(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';
    const limit = 10;
    const totalPages = Math.ceil(pageTotal / limit);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await userService.getAll({ page, limit, search });
            setUsers(data.items);
            setPageTotal(data.total);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const query = formData.get('search') as string;
        setSearchParams({ page: '1', search: query });
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;

        try {
            await userService.deleteUser(user.id);
            toast.success('User deleted');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Users</h1>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            name="search"
                            placeholder="Search users..."
                            className="pl-9"
                            defaultValue={search}
                        />
                    </div>
                    <Button type="submit" variant="secondary">Search</Button>
                </form>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="h-8 w-20 ml-auto" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : users.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8">No users found.</TableCell></TableRow>
                        ) : (
                            users.map((user, index) => (
                                <TableRow key={user.id}>
                                    <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium">{user.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                            user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                                        )}>
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {user.role !== 'admin' && (
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleDelete(user)}
                                                title="Delete User"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                <span className="ml-2">Delete</span>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setSearchParams({ page: String(page - 1), search })}
                >
                    Previous
                </Button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages || 1}</span>
                <Button
                    variant="outline"
                    disabled={page >= totalPages || pageTotal === 0}
                    onClick={() => setSearchParams({ page: String(page + 1), search })}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};
