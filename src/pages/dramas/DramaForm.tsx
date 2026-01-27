import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { dramaService } from '../../services/drama';
import { genreService } from '../../services/genre';
import { actorService } from '../../services/actor';
import type { Genre, Actor } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

const dramaSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    synopsis: z.string().min(10, 'Synopsis must be at least 10 characters'),
    poster_url: z.string().url('Invalid URL format').optional().or(z.literal('')),
    year: z.coerce.number().min(1900).max(new Date().getFullYear() + 5),
    total_seasons: z.coerce.number().min(1),
    status: z.enum(['ongoing', 'completed']),
    genre_ids: z.array(z.string()).min(1, 'Select at least one genre'),
    // Actors are handled separately via state to manage roles easily, or can be field array
});

type DramaFormData = z.infer<typeof dramaSchema>;

interface SelectedActor {
    actor_id: string;
    role: 'main' | 'support';
    name?: string; // For display
    photo_url?: string; // For display
}

export const DramaForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const [isLoading, setIsLoading] = useState(false);

    // Data Sources
    const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
    const [availableActors, setAvailableActors] = useState<Actor[]>([]);

    // Local state for Actors selection
    const [selectedActors, setSelectedActors] = useState<SelectedActor[]>([]);
    const [currentActorId, setCurrentActorId] = useState<string>('');
    const [currentActorRole, setCurrentActorRole] = useState<'main' | 'support'>('main');

    // Async Actor Search State
    const [actorSearch, setActorSearch] = useState('');
    const [actorPage, setActorPage] = useState(1);
    const [isActorsLoading, setIsActorsLoading] = useState(false);
    const [hasMoreActors, setHasMoreActors] = useState(true);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<DramaFormData>({
        resolver: zodResolver(dramaSchema) as any,
        defaultValues: {
            status: 'ongoing',
            total_seasons: 1,
            genre_ids: [],
        }
    });

    const watchedGenreIds = watch('genre_ids');

    // Fetch Actors (Debounced Search + Pagination)
    useEffect(() => {
        const fetchActors = async () => {
            setIsActorsLoading(true);
            try {
                // If searching, reset page to 1 (handled by search effect dependency below?) 
                // No, we need separate effect for search change to reset page

                const response = await actorService.getAll({
                    page: actorPage,
                    limit: 10,
                    search: actorSearch
                });

                // API returns { items: Actor[], total: number, ... }
                // So response is that object.
                const actors = response.items || [];
                const total = response.total || 0;

                if (Array.isArray(actors)) {
                    if (actorPage === 1) {
                        setAvailableActors(actors);
                    } else {
                        setAvailableActors(prev => [...prev, ...actors]);
                    }
                    // Determine if has more based on total or if current fetch is full page
                    setHasMoreActors(availableActors.length + actors.length < total);
                }
            } catch (error) {
                console.error("Failed to fetch actors", error);
            } finally {
                setIsActorsLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchActors();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [actorSearch, actorPage]);

    // Reset page when search changes
    useEffect(() => {
        setActorPage(1);
    }, [actorSearch]);


    // Fetch Initial Data (Genres Only & Drama Details)
    useEffect(() => {
        const loadData = async () => {
            try {
                const genresData = await genreService.getAll({ limit: 100 });
                setAvailableGenres(genresData);

                if (isEditMode) {
                    const drama = await dramaService.getById(id);
                    setValue('title', drama.title);
                    setValue('synopsis', drama.synopsis);
                    setValue('poster_url', drama.poster_url || '');
                    setValue('year', drama.year);
                    setValue('total_seasons', drama.total_seasons);
                    setValue('status', drama.status);

                    // Set Genres
                    if (drama.genres) {
                        setValue('genre_ids', drama.genres.map(g => g.id));
                    }

                    // Set Actors
                    if (drama.actors) {
                        setSelectedActors(drama.actors.map(da => ({
                            actor_id: da.actor.id,
                            role: da.role as 'main' | 'support',
                            name: da.actor.name,
                            photo_url: da.actor.photo_url
                        })));
                    }
                }
            } catch (error) {
                toast.error('Failed to load data');
                if (isEditMode) navigate('/dramas');
            }
        };
        loadData();
    }, [id, isEditMode, setValue, navigate]);

    // Handle Genre Toggle
    const toggleGenre = (genreId: string) => {
        const current = watchedGenreIds || [];
        if (current.includes(genreId)) {
            setValue('genre_ids', current.filter(id => id !== genreId));
        } else {
            setValue('genre_ids', [...current, genreId]);
        }
    };

    // Handle Add Actor
    const handleAddActor = () => {
        if (!currentActorId) return;
        if (selectedActors.some(a => a.actor_id === currentActorId)) {
            toast.error('Actor already added');
            return;
        }

        const actor = availableActors.find(a => a.id === currentActorId);
        if (actor) {
            setSelectedActors([
                ...selectedActors,
                {
                    actor_id: actor.id,
                    role: currentActorRole,
                    name: actor.name,
                    photo_url: actor.photo_url
                }
            ]);
            setCurrentActorId(''); // Reset selection
        }
    };

    const removeActor = (actorId: string) => {
        setSelectedActors(selectedActors.filter(a => a.actor_id !== actorId));
    };

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                year: Number(data.year),
                total_seasons: Number(data.total_seasons),
                poster_url: data.poster_url || undefined,
                actors: selectedActors.map(a => ({
                    actor_id: a.actor_id,
                    role: a.role
                }))
            };

            if (isEditMode) {
                await dramaService.update(id, payload);
                toast.success('Drama updated successfully');
            } else {
                await dramaService.create(payload);
                toast.success('Drama created successfully');
            }
            navigate('/dramas');
        } catch (error) {
            toast.error(isEditMode ? 'Failed to update drama' : 'Failed to create drama');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Link to="/dramas">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">
                    {isEditMode ? 'Edit Drama' : 'Add New Drama'}
                </h1>
            </div>

            <Card>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                            <Input
                                label="Title"
                                placeholder="e.g. Goblin"
                                error={errors.title?.message}
                                {...register('title')}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Year"
                                    type="number"
                                    placeholder="2024"
                                    error={errors.year?.message}
                                    {...register('year')}
                                />
                                <Input
                                    label="Total Seasons"
                                    type="number"
                                    placeholder="1"
                                    error={errors.total_seasons?.message}
                                    {...register('total_seasons')}
                                />
                            </div>

                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    {...register('status')}
                                >
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <Input
                                label="Poster URL"
                                placeholder="https://example.com/poster.jpg"
                                error={errors.poster_url?.message}
                                {...register('poster_url')}
                            />

                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Synopsis</label>
                                <textarea
                                    rows={4}
                                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    placeholder="Enter drama synopsis..."
                                    {...register('synopsis')}
                                />
                                {errors.synopsis?.message && <p className="mt-1 text-sm text-red-500">{errors.synopsis.message}</p>}
                            </div>
                        </div>

                        {/* Genres */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Genres</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {availableGenres.map(genre => (
                                    <label key={genre.id} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            value={genre.id}
                                            checked={(watchedGenreIds || []).includes(genre.id)}
                                            onChange={() => toggleGenre(genre.id)}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700">{genre.name}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.genre_ids?.message && <p className="text-sm text-red-500">{errors.genre_ids.message}</p>}
                        </div>

                        {/* Actors */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Cast</h3>

                            <div className="flex-1 space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Select Actor</label>

                                {/* Actor Search Input */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search actors..."
                                        className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={actorSearch}
                                        onChange={(e) => setActorSearch(e.target.value)}
                                    />
                                </div>

                                {/* Actor List Dropdown Area */}
                                <div className="border rounded-md max-h-60 overflow-y-auto bg-white shadow-sm">
                                    {isActorsLoading ? (
                                        <div className="p-2 space-y-2">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="flex items-center justify-between p-2">
                                                    <div className="flex items-center gap-2">
                                                        <Skeleton className="h-8 w-8 rounded-full" />
                                                        <Skeleton className="h-4 w-32" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : availableActors.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">No actors found.</div>
                                    ) : (
                                        <div className="divide-y">
                                            {availableActors.map(actor => {
                                                const isSelected = selectedActors.some(sa => sa.actor_id === actor.id);
                                                return (
                                                    <div
                                                        key={actor.id}
                                                        className={`p-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${currentActorId === actor.id ? 'bg-primary-50' : ''}`}
                                                        onClick={() => !isSelected && setCurrentActorId(actor.id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs">
                                                                {actor.name.charAt(0)}
                                                            </div>
                                                            <span className={`text-sm ${isSelected ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                                {actor.name}
                                                            </span>
                                                        </div>
                                                        {isSelected && <span className="text-xs text-gray-400">Added</span>}
                                                        {!isSelected && currentActorId === actor.id && <div className="h-2 w-2 rounded-full bg-primary-500"></div>}
                                                    </div>
                                                );
                                            })}
                                            {hasMoreActors && (
                                                <div className="p-2 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setActorPage(p => p + 1)}
                                                        isLoading={isActorsLoading}
                                                    >
                                                        Load More
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-40 flex flex-col justify-end">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm h-[38px]"
                                    value={currentActorRole}
                                    onChange={(e) => setCurrentActorRole(e.target.value as 'main' | 'support')}
                                >
                                    <option value="main">Main Role</option>
                                    <option value="support">Support Role</option>
                                </select>
                                <div className="mt-2 text-right">
                                    <Button type="button" onClick={handleAddActor} disabled={!currentActorId} className="w-full">
                                        <Plus className="h-4 w-4 mr-2" /> Add
                                    </Button>
                                </div>
                            </div>

                            {/* Selected Actors List */}
                            <div className="space-y-2">
                                {selectedActors.map((actor) => (
                                    <div key={actor.actor_id} className="sys-list-item flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            {actor.photo_url ? (
                                                <img src={actor.photo_url} alt={actor.name} className="h-10 w-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                                    {actor.name?.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{actor.name}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${actor.role === 'main' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {actor.role === 'main' ? 'Main Cast' : 'Supporting Cast'}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => removeActor(actor.actor_id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {selectedActors.length === 0 && (
                                    <p className="text-sm text-gray-500 italic text-center py-4">No actors added yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t">
                            <Button type="submit" isLoading={isLoading} size="lg">
                                {isEditMode ? 'Save Changes' : 'Create Drama'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};
