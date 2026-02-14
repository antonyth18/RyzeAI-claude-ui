import { useState, useEffect, useCallback, useMemo } from 'react';
import { agentService } from '../services/agentService';
import type { Message, ProjectMeta, ProjectFile } from '../services/agentService';

export interface AgentFile {
    id: string;
    name: string;
    messages: Message[];
    currentCode: string;
    plan: any; // Renamed from lastPlan
    versions: any[];
    versionIndex: number;
}

export function useAgent() {
    const [files, setFiles] = useState<AgentFile[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
    const [meta, setMeta] = useState<ProjectMeta | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showUndoToast, setShowUndoToast] = useState(false);

    // Derived current state for the active file
    const activeFile = useMemo(() =>
        files.find(f => f.id === activeFileId) || null
        , [files, activeFileId]);

    const getActiveFile = useCallback(() => {
        return files.find(f => f.id === activeFileId) || null;
    }, [files, activeFileId]);

    const createFile = useCallback((name?: string) => {
        const id = Date.now().toString();
        const newFile: AgentFile = {
            id,
            name: name || `File ${files.length + 1}`,
            messages: [],
            currentCode: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="p-8">\n      <h1 className="text-4xl font-bold">New File</h1>\n      <p className="mt-4 text-gray-600">Start building your amazing component.</p>\n    </div>\n  );\n}`,
            plan: null,
            versions: [],
            versionIndex: -1
        };
        setFiles(prev => [...prev, newFile]);
        setActiveFileId(id);
        return id;
    }, [files.length]);

    const setActiveFile = useCallback((id: string) => {
        setActiveFileId(id);
    }, []);

    const addMessageToActiveFile = useCallback((message: Message) => {
        setFiles(prev => prev.map(f => {
            if (f.id !== activeFileId) return f;
            return {
                ...f,
                messages: [...f.messages, message]
            };
        }));
    }, [activeFileId]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [history, code, fsFiles, projectMeta, versionHistory] = await Promise.all([
                agentService.getChatHistory(),
                agentService.getCurrentCode(),
                agentService.getFiles(),
                agentService.getProjectMeta(),
                agentService.getVersions()
            ]);

            setProjectFiles(fsFiles);
            setMeta(projectMeta);

            // Initialize the first file if nothing exists in local state
            if (files.length === 0) {
                const id = 'initial-file';
                const initialFile: AgentFile = {
                    id,
                    name: 'App.tsx',
                    messages: history,
                    currentCode: code.code,
                    plan: null, // We'll infer this if needed
                    versions: versionHistory.map((v: any) => ({
                        id: v.id,
                        prompt: v.prompt,
                        timestamp: v.timestamp,
                        codeSnapshot: v.code,
                        plan: v.plan,
                        explanation: v.explanation
                    })),
                    versionIndex: versionHistory.length - 1
                };
                setFiles([initialFile]);
                setActiveFileId(id);
            }
        } catch (err) {
            setError('Failed to fetch data from server');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [files.length]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const rollbackVersion = useCallback(async (versionId: string, index: number) => {
        if (!activeFileId) return;
        setIsLoading(true);
        try {
            await agentService.rollbackVersion(versionId);
            setFiles(prev => prev.map(f => {
                if (f.id !== activeFileId) return f;
                const version = f.versions[index];
                return {
                    ...f,
                    versionIndex: index,
                    currentCode: version ? version.codeSnapshot : f.currentCode,
                    plan: version ? version.plan : f.plan
                };
            }));
        } catch (err) {
            setError('Failed to rollback version');
        } finally {
            setIsLoading(false);
        }
    }, [activeFileId]);

    const undo = useCallback(() => {
        if (activeFile && activeFile.versionIndex > 0) {
            const prevIndex = activeFile.versionIndex - 1;
            rollbackVersion(activeFile.versions[prevIndex].id, prevIndex);
        }
    }, [activeFile, rollbackVersion]);

    const redo = useCallback(() => {
        if (activeFile && activeFile.versionIndex < activeFile.versions.length - 1) {
            const nextIndex = activeFile.versionIndex + 1;
            rollbackVersion(activeFile.versions[nextIndex].id, nextIndex);
        }
    }, [activeFile, rollbackVersion]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMod = e.metaKey || e.ctrlKey;
            if (isMod && e.key === 'z') {
                if (e.shiftKey) redo();
                else undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const sendMessage = async (prompt: string) => {
        if (!activeFileId || !activeFile) return;

        setIsLoading(true);
        setError(null);

        // Optimistic update for user message
        const userMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: prompt,
            timestamp: new Date().toLocaleTimeString()
        };
        addMessageToActiveFile(userMessage);

        try {
            const result = await agentService.generateCode(prompt, activeFile.plan);

            const newVersion = {
                id: result.version ? result.version.id : Date.now().toString(),
                prompt,
                timestamp: result.version ? result.version.timestamp : new Date().toISOString(),
                codeSnapshot: result.code,
                plan: result.plan,
                explanation: result.explanation
            };

            setFiles(prev => prev.map(f => {
                if (f.id !== activeFileId) return f;

                // Add response to messages
                const assistantMessage: Message = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: result.explanation, // Or a summary
                    timestamp: new Date().toLocaleTimeString()
                };

                const newVersions = [...f.versions.slice(0, f.versionIndex + 1), newVersion];

                return {
                    ...f,
                    messages: [...f.messages, assistantMessage],
                    currentCode: result.code,
                    plan: result.plan,
                    versions: newVersions,
                    versionIndex: newVersions.length - 1
                };
            }));

            setShowUndoToast(true);
            setTimeout(() => setShowUndoToast(false), 6000);
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Failed to send message';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const renameFile = useCallback((id: string, newName: string) => {
        setFiles(prev => prev.map(f => {
            if (f.id !== id) return f;
            return { ...f, name: newName };
        }));
    }, []);

    const deleteFile = useCallback((id: string) => {
        setFiles(prev => {
            const newFiles = prev.filter(f => f.id !== id);

            // If we deleted the active file, switch to the last available file or clear selection
            if (id === activeFileId) {
                const nextFile = newFiles.length > 0 ? newFiles[newFiles.length - 1] : null;
                setActiveFileId(nextFile ? nextFile.id : null);
            }

            return newFiles;
        });
    }, [activeFileId]);

    return {
        messages: activeFile?.messages || [],
        currentCode: activeFile?.currentCode || '',
        agentFiles: files,
        projectFiles,
        activeFileId,
        meta,
        isLoading,
        error,
        sendMessage,
        undo,
        redo,
        rollbackVersion,
        versions: activeFile?.versions || [],
        versionIndex: activeFile?.versionIndex ?? -1,
        showUndoToast,
        setShowUndoToast,
        createFile,
        setActiveFile,
        refresh: fetchData,
        getActiveFile,
        addMessageToActiveFile,
        renameFile,
        deleteFile
    };
}

