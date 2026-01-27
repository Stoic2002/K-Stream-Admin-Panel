import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { genreService } from '@/services/genre';
import type { Genre } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const genreSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().optional(),
});

type GenreFormData = z.infer<typeof genreSchema>;

export const Genres = () => {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [pageTotal, setPageTotal] = useState(0);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingGenre, setEditingGenre] = useState<Genre | null>(null);

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
    } = useForm<GenreFormData>({
        resolver: zodResolver(genreSchema),
    });

    const fetchGenres = async () => {
        setIsLoading(true);
        try {
            const data = await genreService.getAll({ page, limit, search });
            // Handle flat array response
            if (Array.isArray(data)) {
                setGenres(data);
                setPageTotal(data.length); // Fallback for pagination
            } else {
                // Fallback if structure changes back
                setGenres((data as any).items || []);
                setPageTotal((data as any).total || 0);
            }
        } catch (error) {
            toast.error('Failed to fetch genres');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGenres();
    }, [page, search]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const query = formData.get('search') as string;
        setSearchParams({ page: '1', search: query });
    };

    const handleEdit = (genre: Genre) => {
        setEditingGenre(genre);
        setValue('name', genre.name);
        setValue('slug', genre.slug);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingGenre(null);
        reset();
        setIsDialogOpen(true);
    };

    const onSubmit = async (data: GenreFormData) => {
        try {
            if (editingGenre) {
                await genreService.update(editingGenre.id, data);
                toast.success('Genre updated');
            } else {
                await genreService.create(data);
                toast.success('Genre created');
            }
            setIsDialogOpen(false);
            fetchGenres();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this genre?')) return;
        try {
            await genreService.delete(id);
            toast.success('Genre deleted');
            fetchGenres();
        } catch (error) {
            toast.error('Failed to delete genre');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Genres</h1>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Genre
                </Button>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            name="search"
                            placeholder="Search genres..."
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
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : genres.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8">No genres found.</TableCell></TableRow>
                        ) : (
                            genres.map((genre, index) => (
                                <TableRow key={genre.id}>
                                    <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                                    <TableCell className="font-medium">{genre.name}</TableCell>
                                    <TableCell className="text-gray-500">{genre.slug}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleEdit(genre)}><Pencil className="h-4 w-4" /></Button>
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(genre.id)}><Trash2 className="h-4 w-4" /></Button>
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
                        <DialogTitle>{editingGenre ? 'Edit Genre' : 'New Genre'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Genre Name"
                            error={errors.name?.message}
                            placeholder="e.g. Action"
                            {...register('name')}
                        />
                        <Input
                            label="Slug (Optional)"
                            error={errors.slug?.message}
                            placeholder="e.g. action-movie"
                            {...register('slug')}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">{editingGenre ? 'Update' : 'Create'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};
