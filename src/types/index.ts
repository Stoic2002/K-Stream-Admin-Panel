export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar_url?: string;
    is_banned?: boolean;
}

export interface AuthResponse {
    success: boolean;
    data: {
        token: string;
        user: User;
    };
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface Genre {
    id: string;
    name: string;
    slug: string;
}

export interface Actor {
    id: string;
    name: string;
    photo_url: string;
}

export interface Drama {
    id: string;
    title: string;
    synopsis: string;
    poster_url: string;
    year: number;
    rating: number;
    total_seasons: number;
    status: 'ongoing' | 'completed';
    view_count: number;
    created_at: string;
    genres?: Genre[];
    actors?: { actor: Actor; role: string }[];
}

export interface Episode {
    id: string;
    season_id: string;
    episode_number: number;
    title: string;
    video_url: string; // iframe url
    duration: number;
    thumbnail_url: string;
    view_count: number;
}

export interface Season {
    id: string;
    drama_id: string;
    season_number: number;
    title: string;
    synopsis?: string;
    poster_url?: string;
    release_date?: string;
    episodes?: Episode[];
}

export interface DashboardStats {
    total_users: number;
    total_dramas: number;
    total_episodes: number;
    total_views: number;
    new_users_count?: number;
    new_dramas_count?: number;
}
