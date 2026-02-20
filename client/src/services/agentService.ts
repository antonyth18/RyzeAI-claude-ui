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
    getChatHistory: async (fileName?: string): Promise<Message[]> => {
        const response = await axios.get(`${API_BASE_URL}/chat/history`, { params: { fileName } });
        return response.data;
    },

    getCurrentCode: async (fileName?: string): Promise<{ code: string }> => {
        const response = await axios.get(`${API_BASE_URL}/code/current`, { params: { fileName } });
        return response.data;
    },
    getVersions: async (fileName?: string): Promise<any> => {
        const response = await axios.get(`${API_BASE_URL}/versions`, { params: { fileName } });
        return response.data;
    },

    getFiles: async (): Promise<ProjectFile[]> => {
        const response = await axios.get(`${API_BASE_URL}/files`);
        return response.data;
    },

    createFile: async (name: string): Promise<{ status: string, fileName: string }> => {
        const response = await axios.post(`${API_BASE_URL}/files/create`, { name });
        return response.data;
    },

    getProjectMeta: async (): Promise<ProjectMeta> => {
        const response = await axios.get(`${API_BASE_URL}/project/meta`);
        return response.data;
    },

    generateCode: async (prompt: string, fileName: string, previousPlan?: any): Promise<{ plan: any; code: string; explanation: string; version: any }> => {
        const response = await axios.post(`${API_BASE_URL}/agent/generate`, { prompt, fileName, previousPlan });
        return response.data;
    },

    refactorCode: async (fileName: string): Promise<{ status: string }> => {
        const response = await axios.post(`${API_BASE_URL}/agent/refactor`, { fileName });
        return response.data;
    },

    regenerateComponent: async (fileName: string): Promise<{ status: string }> => {
        const response = await axios.post(`${API_BASE_URL}/agent/regenerate`, { fileName });
        return response.data;
    },

    rollbackVersion: async (id: string, fileName: string): Promise<{ status: string; version: any }> => {
        const response = await axios.post(`${API_BASE_URL}/version/rollback`, { id, fileName });
        return response.data;
    },

    deleteFile: async (name: string): Promise<{ status: string; fileName: string }> => {
        const response = await axios.delete(`${API_BASE_URL}/files/${name}`);
        return response.data;
    },

    resetState: async (): Promise<{ status: string }> => {
        const response = await axios.post(`${API_BASE_URL}/state/reset`);
        return response.data;
    }
};

