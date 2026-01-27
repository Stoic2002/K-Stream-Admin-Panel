import api from './api';
import type { ApiResponse, User } from '../types';

export const userService = {
    getAll: async (params?: { page?: number; limit?: number; search?: string }) => {
        const response = await api.get<ApiResponse<{ items: User[]; total: number; page: number; total_pages: number }>>('/analytics/users', { params });
        return response.data.data;
    },

    updateRole: async (id: string, role: 'admin' | 'user') => {
        const response = await api.patch<ApiResponse<User>>(`/analytics/users/${id}/role`, { role });
        return response.data.data;
    },

    deleteUser: async (id: string) => {
        const response = await api.delete<ApiResponse<null>>(`/analytics/users/${id}`);
        return response.data;
    },
};
