import { useState, useEffect, useCallback } from 'react';
import { agentService } from '../services/agentService';
import type { Message, ProjectMeta, ProjectFile } from '../services/agentService';

export function useAgent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentCode, setCurrentCode] = useState<string>('');
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [meta, setMeta] = useState<ProjectMeta | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [history, code, projectFiles, projectMeta] = await Promise.all([
                agentService.getChatHistory(),
                agentService.getCurrentCode(),
                agentService.getFiles(),
                agentService.getProjectMeta()
            ]);
            setMessages(history);
            setCurrentCode(code.code);
            setFiles(projectFiles);
            setMeta(projectMeta);
        } catch (err) {
            setError('Failed to fetch data from server');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sendMessage = async (prompt: string) => {
        setIsLoading(true);
        try {
            await agentService.generateCode(prompt);
            // Refresh messages after a short delay or poll
            setTimeout(() => fetchData(), 1200);
        } catch (err) {
            setError('Failed to send message');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        currentCode,
        files,
        meta,
        isLoading,
        error,
        sendMessage,
        refresh: fetchData
    };
}
