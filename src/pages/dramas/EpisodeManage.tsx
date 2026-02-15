import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dramaService } from '../../services/drama';
import { seasonService, episodeService } from '../../services/episode';
import type { Drama, Season, Episode } from '../../types';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { ArrowLeft, Plus, Trash2, Pencil, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/Dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '../../utils/cn';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';

const episodeSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    episode_number: z.coerce.number().min(1),
    duration: z.coerce.number().min(1),
    video_url: z.string().url('Invalid URL'),
    thumbnail_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type EpisodeFormData = z.infer<typeof episodeSchema>;

export const EpisodeManage = () => {
    const { dramaId } = useParams();
    const [drama, setDrama] = useState<Drama | null>(null);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form for new episode
    const { register, handleSubmit, reset, formState: { errors } } = useForm<EpisodeFormData>({
        resolver: zodResolver(episodeSchema) as any,
    });

    const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);

    // Fetch Drama & Seasons
    const fetchData = async () => {
        if (!dramaId) return;
        setIsLoading(true);
        try {
            const [dramaData, seasonsData] = await Promise.all([
                dramaService.getById(dramaId),
                seasonService.getByDrama(dramaId)
            ]);
            setDrama(dramaData);
            setSeasons(seasonsData || []);
            if (seasonsData && seasonsData.length > 0 && !selectedSeason) {
                setSelectedSeason(seasonsData[0].id);
            }
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dramaId]);

    const handleCreateOrUpdateEpisode = async (data: any) => {
        if (!selectedSeason) return;

        // Convert Duration from Minutes to Seconds
        const payload = {
            ...data,
            duration: Number(data.duration) * 60, // Minutes to Seconds
            season_id: selectedSeason,
        };

        try {
            if (editingEpisode) {
                await episodeService.update(editingEpisode.id, payload);
                toast.success('Episode updated');
            } else {
                await episodeService.create({
                    ...payload,
                    view_count: 0
                });
                toast.success('Episode created');
            }
            setIsDialogOpen(false);
            setEditingEpisode(null);
            reset();
            window.location.reload();
        } catch (error) {
            toast.error(editingEpisode ? 'Failed to update episode' : 'Failed to create episode');
        }
    };

    const openCreateDialog = () => {
        setEditingEpisode(null);
        reset({
            episode_number: 1,
            title: '',
            duration: 60, // Default 60 mins
            video_url: '',
            thumbnail_url: ''
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (episode: Episode) => {
        setEditingEpisode(episode);
        // Populate form, converting Seconds back to Minutes
        reset({
            episode_number: episode.episode_number,
            title: episode.title,
            duration: Math.round(episode.duration / 60), // Seconds to Minutes
            video_url: episode.video_url,
            thumbnail_url: episode.thumbnail_url
        });
        setIsDialogOpen(true);
    };

    // Create Default Season if none exists
    const handleCreateSeason = async () => {
        if (!dramaId) return;
        const seasonNumber = seasons.length + 1;
        try {
            await seasonService.create({
                drama_id: dramaId,
                season_number: seasonNumber,
                title: `Season ${seasonNumber}`
            });
            toast.success('Season added');
            fetchData();
        } catch (error) {
            toast.error('Failed to create season');
        }
    };

    const handleDeleteSeason = async (seasonId: string) => {
        if (!confirm("Are you sure you want to delete this season? All episodes in it will be lost.")) return;
        try {
            await seasonService.delete(seasonId);
            toast.success('Season deleted');
            if (selectedSeason === seasonId) setSelectedSeason(null);
            fetchData();
        } catch (error) {
            toast.error('Failed to delete season');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/dramas">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back to Dramas
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manage Episodes</h1>
                    {drama && <p className="text-gray-500">{drama.title} ({drama.year})</p>}
                </div>
            </div>

            <div className="flex gap-6">
                {/* Seasons Sidebar */}
                <div className="w-64 flex-shrink-0 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700">Seasons</h3>
                        <Button size="sm" variant="outline" onClick={handleCreateSeason}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <div className="space-y-1">
                        <div className="space-y-1">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-4" />
                                    </div>
                                ))
                            ) : (
                                <>
                                    {Array.isArray(seasons) && seasons.map(season => (
                                        <div
                                            key={season.id}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer group",
                                                selectedSeason === season.id
                                                    ? 'bg-primary-50 text-primary-700'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            )}
                                            onClick={() => setSelectedSeason(season.id)}
                                        >
                                            <span>{season.title}</span>
                                            <button
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSeason(season.id);
                                                }}
                                                title="Delete Season"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {seasons.length === 0 && (
                                        <div className="text-sm text-gray-400 italic">No seasons found. Add one!</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Episodes List */}
                <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm p-6 min-h-[400px]">
                    {selectedSeason ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-800">Episodes List</h3>
                                <Button size="sm" onClick={openCreateDialog}><Plus className="h-4 w-4 mr-2" />Add Episode</Button>
                            </div>
                            <EpisodeList
                                seasonId={selectedSeason}
                                key={selectedSeason}
                                onEdit={openEditDialog}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Select or create a season to manage episodes
                        </div>
                    )}
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingEpisode ? 'Edit Episode' : 'Add New Episode'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(handleCreateOrUpdateEpisode)} className="space-y-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1">
                                    <Input label="No." type="number" {...register('episode_number')} error={errors.episode_number?.message} />
                                </div>
                                <div className="col-span-3">
                                    <Input label="Title" {...register('title')} error={errors.title?.message} />
                                </div>
                            </div>
                            <Input label="Duration (minutes)" type="number" {...register('duration')} error={errors.duration?.message} />
                            <Input label="Video URL" {...register('video_url')} error={errors.video_url?.message} />
                            <Input label="Thumbnail URL" {...register('thumbnail_url')} error={errors.thumbnail_url?.message} />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingEpisode ? 'Save Changes' : 'Create'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

// Sub-component for Episode List
const EpisodeList = ({ seasonId, onEdit }: { seasonId: string, onEdit: (ep: Episode) => void }) => {
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEpisodes = async () => {
        setLoading(true);
        try {
            const data = await episodeService.getBySeason(seasonId);
            setEpisodes(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEpisodes();
    }, [seasonId]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete episode?")) return;
        await episodeService.delete(id);
        fetchEpisodes();
        toast.success("Episode deleted");
    }

const handlePlay = (url: string) => {
    if (url) {
        const newWindow = window.open(url, '_blank', 'noreferrer');
        // Jika browser memblokir window.open, fallback ke link manual:
        if (!newWindow) {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noreferrer'; // Ini kuncinya
            link.click();
        }
    } else {
        toast.error("No video URL available");
    }
}
    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                            </TableRow>
                        ))
                    ) : !episodes || episodes.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No episodes yet.</TableCell></TableRow>
                    ) : (
                        episodes.map(ep => (
                            <TableRow key={ep.id}>
                                <TableCell>{ep.episode_number}</TableCell>
                                <TableCell className="font-medium">{ep.title}</TableCell>
                                <TableCell>{Math.round(ep.duration / 60)}m</TableCell>
                                <TableCell>{ep.view_count}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" title="Preview" onClick={() => handlePlay(ep.video_url)}><PlayCircle className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="outline" onClick={() => onEdit(ep)}><Pencil className="h-4 w-4" /></Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(ep.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
