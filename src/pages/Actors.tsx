import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { actorService } from '@/services/actor';
import type { Actor } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Plus, Search, Pencil, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';

const actorSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    photo_url: z.string().url('Invalid URL format').optional().or(z.literal('')),
});

type ActorFormData = z.infer<typeof actorSchema>;

export const Actors = () => {
    const [actors, setActors] = useState<Actor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [pageTotal, setPageTotal] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingActor, setEditingActor] = useState<Actor | null>(null);

    const page = Number(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';
    const limit = 10;
    const totalPages = Math.ceil(pageTotal / limit);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<ActorFormData>({
        resolver: zodResolver(actorSchema),
    });

    const fetchActors = async () => {
        setIsLoading(true);
        try {
            const data = await actorService.getAll({ page, limit, search });
            // Handle flat array response
            if (Array.isArray(data)) {
                setActors(data);
                setPageTotal(data.length);
            } else {
                setActors((data as any).items || []);
                setPageTotal((data as any).total || 0);
            }
        } catch (error) {
            toast.error('Failed to fetch actors');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchActors();
    }, [page, search]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const query = formData.get('search') as string;
        setSearchParams({ page: '1', search: query });
    };

    const handleEdit = (actor: Actor) => {
        setEditingActor(actor);
        setValue('name', actor.name);
        setValue('photo_url', actor.photo_url);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingActor(null);
        reset();
        setIsDialogOpen(true);
    };

    const onSubmit = async (data: ActorFormData) => {
        try {
            if (editingActor) {
                await actorService.update(editingActor.id, data);
                toast.success('Actor updated');
            } else {
                await actorService.create(data);
                toast.success('Actor created');
            }
            setIsDialogOpen(false);
            fetchActors();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this actor?')) return;
        try {
            await actorService.delete(id);
            toast.success('Actor deleted');
            fetchActors();
        } catch (error) {
            toast.error('Failed to delete actor');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Actors</h1>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Actor
                </Button>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            name="search"
                            placeholder="Search actors..."
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
                            <TableHead>Photo</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : actors.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8">No actors found.</TableCell></TableRow>
                        ) : (
                            actors.map((actor, index) => (
                                <TableRow key={actor.id}>
                                    <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                                    <TableCell>
                                        {actor.photo_url ? (
                                            <img src={actor.photo_url} alt={actor.name} className="h-10 w-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <User className="h-5 w-5 text-gray-400" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{actor.name}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleEdit(actor)}><Pencil className="h-4 w-4" /></Button>
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(actor.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingActor ? 'Edit Actor' : 'New Actor'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Name"
                            error={errors.name?.message}
                            placeholder="e.g. Kim Soo-hyun"
                            {...register('name')}
                        />
                        <Input
                            label="Photo URL"
                            error={errors.photo_url?.message}
                            placeholder="https://example.com/photo.jpg"
                            {...register('photo_url')}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">{editingActor ? 'Update' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
