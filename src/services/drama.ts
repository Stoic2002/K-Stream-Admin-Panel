import api from './api';
import type { ApiResponse, Drama } from '../types';

export const dramaService = {
    getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string; genre?: string; sort?: string }) => {
        const queryParams = {
            ...params,
            q: params?.search, // Backend expects 'q' for search
        };
        const response = await api.get<ApiResponse<{ items: Drama[]; total: number; page: number; total_pages: number }>>('/dramas', { params: queryParams });
        return response.data.data;
    },

    getById: async (id: string) => {
        const response = await api.get<ApiResponse<Drama>>(`/dramas/${id}`);
        return response.data.data;
    },

    create: async (data: Partial<Drama>) => {
        const response = await api.post<ApiResponse<Drama>>('/dramas', data);
        return response.data.data;
    },

    update: async (id: string, data: Partial<Drama>) => {
        const response = await api.put<ApiResponse<Drama>>(`/dramas/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string) => {
        const response = await api.delete<ApiResponse<null>>(`/dramas/${id}`);
        return response.data;
    },
};
