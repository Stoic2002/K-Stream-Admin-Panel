import api from './api';
import type { ApiResponse, DashboardStats } from '../types';

export const analyticsService = {
    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await api.get<ApiResponse<DashboardStats>>('/analytics/dashboard');
        return response.data.data;
    },
};
