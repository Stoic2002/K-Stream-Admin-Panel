import api from './api';
import type { ApiResponse, Episode, Season } from '../types';

export const episodeService = {
    getBySeason: async (seasonId: string) => {
        const response = await api.get<ApiResponse<Episode[]>>(`/seasons/${seasonId}/episodes`);
        return response.data.data;
    },

    create: async (data: Partial<Episode>) => {
        const response = await api.post<ApiResponse<Episode>>('/episodes', data);
        return response.data.data;
    },

    update: async (id: string, data: Partial<Episode>) => {
        const response = await api.put<ApiResponse<Episode>>(`/episodes/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<null>>(`/episodes/${id}`);
        return response.data;
    },
};

export const seasonService = {
    getByDrama: async (dramaId: string) => {
        const response = await api.get<ApiResponse<Season[]>>(`/dramas/${dramaId}/seasons`);
        return response.data.data;
    },

    create: async (data: Partial<Season>) => {
        const response = await api.post<ApiResponse<Season>>('/seasons', data);
        return response.data.data;
    },

    update: async (id: string, data: Partial<Season>) => {
        const response = await api.put<ApiResponse<Season>>(`/seasons/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<null>>(`/seasons/${id}`);
        return response.data;
    },
};
