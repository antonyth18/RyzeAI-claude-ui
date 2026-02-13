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
    const [lastPlan, setLastPlan] = useState<any>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [versionIndex, setVersionIndex] = useState<number>(-1);
    const [showUndoToast, setShowUndoToast] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [history, code, projectFiles, projectMeta, versionHistory] = await Promise.all([
                agentService.getChatHistory(),
                agentService.getCurrentCode(),
                agentService.getFiles(),
                agentService.getProjectMeta(),
                agentService.getVersions()
            ]);
            setMessages(history);
            setCurrentCode(code.code);
            setFiles(projectFiles);
            setMeta(projectMeta);

            // Sync versions and set index to latest
            if (versionHistory && versionHistory.length > 0) {
                // Map backend versions to frontend snapshots if needed
                // For now, assuming backend stores enough context
                const mappedVersions = versionHistory.map((v: any) => ({
                    id: v.id,
                    prompt: v.prompt,
                    timestamp: v.timestamp,
                    codeSnapshot: v.code,
                    plan: v.plan
                }));
                setVersions(mappedVersions);
                setVersionIndex(mappedVersions.length - 1);
            }
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

    const rollbackVersion = useCallback(async (versionId: string, index: number) => {
        setIsLoading(true);
        try {
            await agentService.rollbackVersion(versionId);
            setVersionIndex(index);
            const version = versions[index];
            if (version) {
                setCurrentCode(version.codeSnapshot);
                setLastPlan(version.plan);
            }
        } catch (err) {
            setError('Failed to rollback version');
        } finally {
            setIsLoading(false);
        }
    }, [versions]);

    const undo = useCallback(() => {
        if (versionIndex > 0) {
            const prevIndex = versionIndex - 1;
            rollbackVersion(versions[prevIndex].id, prevIndex);
        }
    }, [versionIndex, versions, rollbackVersion]);

    const redo = useCallback(() => {
        if (versionIndex < versions.length - 1) {
            const nextIndex = versionIndex + 1;
            rollbackVersion(versions[nextIndex].id, nextIndex);
        }
    }, [versionIndex, versions, rollbackVersion]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;
            if (isMod && e.key === 'z') {
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const sendMessage = async (prompt: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await agentService.generateCode(prompt, lastPlan);
            setLastPlan(result.plan);

            // Add to local version history
            const newVersion = {
                id: Date.now().toString(), // Use local ID or get from server if available
                prompt,
                timestamp: new Date().toISOString(),
                codeSnapshot: result.code,
                plan: result.plan
            };

            const newVersions = [...versions.slice(0, versionIndex + 1), newVersion];
            setVersions(newVersions);
            setVersionIndex(newVersions.length - 1);
            setShowUndoToast(true);

            // Auto-dismiss toast after 6 seconds
            setTimeout(() => {
                setShowUndoToast(false);
            }, 6000);

            // Refresh other data
            await fetchData();
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Failed to send message';
            setError(msg);
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
        undo,
        redo,
        rollbackVersion,
        versions,
        versionIndex,
        showUndoToast,
        setShowUndoToast,
        refresh: fetchData
    };
}

