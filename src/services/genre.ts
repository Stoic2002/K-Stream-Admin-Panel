import api from './api';
import type { ApiResponse, Genre } from '../types';

export const genreService = {
    getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get<ApiResponse<Genre[]>>('/genres', { params });
        return response.data.data;
    },

    getById: async (id: string) => {
        const response = await api.get<ApiResponse<Genre>>(`/genres/${id}`);
        return response.data.data;
    },

    create: async (data: Partial<Genre>) => {
        const response = await api.post<ApiResponse<Genre>>('/genres', data);
        return response.data.data;
    },

    update: async (id: string, data: Partial<Genre>) => {
        const response = await api.put<ApiResponse<Genre>>(`/genres/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<null>>(`/genres/${id}`);
        return response.data;
    },
};
