import apiClient from './client';

export interface HealthDTO {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export interface WsStatusDTO {
  connectionCount: number;
  messageThroughput: number;
  perOrgPresence: Record<string, number>;
}

export const adminApi = {
  getHealth() {
    return apiClient.get<HealthDTO>('/health');
  },
  getWsStatus() {
    return apiClient.get<WsStatusDTO>('/ws/status');
  },
};
