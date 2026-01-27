import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { dramaService } from '../../services/drama';
import { genreService } from '../../services/genre';
import type { Drama, Genre } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Plus, Search, Pencil, Trash2, Clapperboard, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/Skeleton';

export const DramaList = () => {
    const [dramas, setDramas] = useState<Drama[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Filter states
    const [status, setStatus] = useState(searchParams.get('status') || '');
    const [genreId, setGenreId] = useState(searchParams.get('genre') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'popular');

    const page = Number(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const data = await genreService.getAll();
                // Handle different response structures if needed, strictly assuming array based on previous files
                if (Array.isArray(data)) {
                    setGenres(data);
                } else {
                    setGenres((data as any).items || []);
                }
            } catch (error) {
                console.error('Failed to fetch genres', error);
            }
        };
        fetchGenres();
    }, []);

    const fetchDramas = async () => {
        setIsLoading(true);
        try {
            const data = await dramaService.getAll({
                page,
                limit: 10,
                search,
                status: status || undefined,
                genre: genreId || undefined,
                sort: sort || undefined
            });
            setDramas(data.items || []);
        } catch (error) {
            toast.error('Failed to fetch dramas');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDramas();
    }, [page, search, status, genreId, sort]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const query = formData.get('search') as string;
        setSearchParams({
            page: '1',
            search: query,
            status,
            genre: genreId,
            sort
        });
    };

    const handleFilterChange = (key: string, value: string) => {
        if (key === 'status') setStatus(value);
        if (key === 'genre') setGenreId(value);
        if (key === 'sort') setSort(value);

        setSearchParams({
            page: '1',
            search,
            status: key === 'status' ? value : status,
            genre: key === 'genre' ? value : genreId,
            sort: key === 'sort' ? value : sort
        });
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this drama?')) return;

        try {
            await dramaService.delete(id);
            toast.success('Drama deleted successfully');
            fetchDramas();
        } catch (error) {
            toast.error('Failed to delete drama');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Dramas</h1>
                <Link to="/dramas/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Drama
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col gap-4 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                name="search"
                                placeholder="Search dramas..."
                                className="pl-9"
                                defaultValue={search}
                            />
                        </div>
                        <Button type="submit" variant="secondary">Search</Button>
                    </form>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className={isFiltersOpen ? 'bg-gray-100' : ''}
                        title="Toggle Filters"
                    >
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                {isFiltersOpen && (
                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Select
                            className="w-[160px]"
                            label="Status"
                            value={status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            options={[
                                { label: 'All Status', value: '' },
                                { label: 'Ongoing', value: 'ongoing' },
                                { label: 'Completed', value: 'completed' },
                            ]}
                        />
                        <Select
                            className="w-[160px]"
                            label="Genre"
                            value={genreId}
                            onChange={(e) => handleFilterChange('genre', e.target.value)}
                            options={[
                                { label: 'All Genres', value: '' },
                                ...genres.map(g => ({ label: g.name, value: g.id }))
                            ]}
                        />
                        <Select
                            className="w-[160px]"
                            label="Sort By"
                            value={sort}
                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                            options={[
                                { label: 'Popular', value: 'popular' },
                                { label: 'Rating', value: 'rating' },
                                { label: 'Newest', value: 'latest' },
                                { label: 'Oldest', value: 'oldest' },
                            ]}
                        />
                    </div>
                )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Poster</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-16 w-12 rounded" /></TableCell>
                                    <TableCell>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-48" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : dramas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">No dramas found.</TableCell>
                            </TableRow>
                        ) : (
                            dramas.map((drama) => (
                                <TableRow key={drama.id}>
                                    <TableCell>
                                        <img
                                            src={drama.poster_url}
                                            alt={drama.title}
                                            className="h-16 w-12 rounded object-cover bg-gray-100"
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x64?text=No+Img' }}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div>{drama.title}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1">{drama.synopsis}</div>
                                    </TableCell>
                                    <TableCell>{drama.year}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${drama.status === 'ongoing' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {drama.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs text-gray-500">
                                            <div>Rating: {drama.rating}</div>
                                            <div>Views: {drama.view_count}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link to={`/dramas/${drama.id}/episodes`}>
                                                <Button size="sm" variant="ghost" title="Manage Seasons & Episodes">
                                                    <Clapperboard className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link to={`/dramas/${drama.id}/edit`}>
                                                <Button size="sm" variant="outline" title="Edit">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(drama.id)} title="Delete">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination (Simple) */}
            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setSearchParams({ page: String(page - 1), search, status, genre: genreId, sort })}
                >
                    Previous
                </Button>
                <span className="text-sm text-gray-600">Page {page}</span>
                <Button
                    variant="outline"
                    disabled={dramas.length < 10} // Simple check
                    onClick={() => setSearchParams({ page: String(page + 1), search, status, genre: genreId, sort })}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};
