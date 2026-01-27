import api from './api';
import type { ApiResponse, Actor } from '../types';

export const actorService = {
    getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get<ApiResponse<any>>('/actors', { params });
        return response.data.data;
    },

    getById: async (id: string) => {
        const response = await api.get<ApiResponse<Actor>>(`/actors/${id}`);
        return response.data.data;
    },

    create: async (data: Partial<Actor>) => {
        const response = await api.post<ApiResponse<Actor>>('/actors', data);
        return response.data.data;
    },

    update: async (id: string, data: Partial<Actor>) => {
        const response = await api.put<ApiResponse<Actor>>(`/actors/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<null>>(`/actors/${id}`);
        return response.data;
    },
};
