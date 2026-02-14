import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5001/api';

export interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ProjectMeta {
    name: string;
    branch: string;
    status: string;
}

export interface ProjectFile {
    name: string;
    type: string;
}

export const agentService = {
    getChatHistory: async (): Promise<Message[]> => {
        const response = await axios.get(`${API_BASE_URL}/chat/history`);
        return response.data;
    },

    getCurrentCode: async (): Promise<{ code: string }> => {
        const response = await axios.get(`${API_BASE_URL}/code/current`);
        return response.data;
    },
    getVersions: async (): Promise<any> => {
        const response = await axios.get(`${API_BASE_URL}/versions`);
        return response.data;
    },

    getFiles: async (): Promise<ProjectFile[]> => {
        const response = await axios.get(`${API_BASE_URL}/files`);
        return response.data;
    },

    getProjectMeta: async (): Promise<ProjectMeta> => {
        const response = await axios.get(`${API_BASE_URL}/project/meta`);
        return response.data;
    },

    generateCode: async (prompt: string, previousPlan?: any): Promise<{ plan: any; code: string; explanation: string; version: any }> => {
        const response = await axios.post(`${API_BASE_URL}/agent/generate`, { prompt, previousPlan });
        return response.data;
    },



    refactorCode: async (): Promise<{ status: string }> => {
        const response = await axios.post(`${API_BASE_URL}/agent/refactor`);
        return response.data;
    },

    regenerateComponent: async (): Promise<{ status: string }> => {
        const response = await axios.post(`${API_BASE_URL}/agent/regenerate`);
        return response.data;
    },

    rollbackVersion: async (id: string): Promise<{ status: string; version: any }> => {
        const response = await axios.post(`${API_BASE_URL}/version/rollback`, { id });
        return response.data;
    }
};
