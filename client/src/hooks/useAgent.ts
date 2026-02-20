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

    const createFile = useCallback(async (name?: string) => {
        let fileName = name;
        if (!fileName) {
            const baseName = "NewComponent";
            let counter = 0;
            const existingNames = new Set(files.map(f => f.name));

            fileName = `${baseName}.tsx`;
            while (existingNames.has(fileName)) {
                counter++;
                fileName = `${baseName}_${counter}.tsx`;
            }
        }

        try {
            setIsLoading(true);
            await agentService.createFile(fileName);

            const newFile: AgentFile = {
                id: fileName, // Use filename as ID for simplicity on backend
                name: fileName,
                messages: [{ id: Date.now(), role: 'assistant', content: `Created ${fileName}. How can I help?`, timestamp: new Date().toLocaleTimeString() }],
                currentCode: `import React from 'react';

export default function Component() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">${fileName}</h1>
      <p className="mt-4 text-gray-600">Start building your amazing component.</p>
    </div>
  );
}`,
                plan: null,
                versions: [],
                versionIndex: -1
            };
            setFiles(prev => [...prev, newFile]);
            setActiveFileId(fileName);
            return fileName;
        } catch (err) {
            setError('Failed to create file on server');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [files]);

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
            const fsFiles = await agentService.getFiles();
            const projectMeta = await agentService.getProjectMeta();

            setProjectFiles(fsFiles);
            setMeta(projectMeta);

            // Load state for each file from the backend
            const fileStates = await Promise.all(fsFiles.map(async (file) => {
                const [history, code, versions] = await Promise.all([
                    agentService.getChatHistory(file.name),
                    agentService.getCurrentCode(file.name),
                    agentService.getVersions(file.name)
                ]);
                return {
                    id: file.name,
                    name: file.name,
                    messages: history,
                    currentCode: code.code,
                    plan: versions.length > 0 ? versions[versions.length - 1].plan : null,
                    versions: versions.map((v: any) => ({
                        id: v.id,
                        prompt: v.prompt,
                        timestamp: v.timestamp,
                        codeSnapshot: v.code,
                        plan: v.plan,
                        explanation: v.explanation
                    })),
                    versionIndex: versions.length - 1
                };
            }));

            if (fileStates.length > 0) {
                setFiles(fileStates);
                if (!activeFileId) setActiveFileId(fileStates[0].name);
            }
        } catch (err) {
            setError('Failed to fetch data from server');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [activeFileId]);

    useEffect(() => {
        fetchData();
    }, []); // Only fetch once on mount

    const rollbackVersion = useCallback(async (versionId: string, index: number) => {
        if (!activeFileId) return;
        setIsLoading(true);
        try {
            await agentService.rollbackVersion(versionId, activeFileId);
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
            const result = await agentService.generateCode(prompt, activeFileId, activeFile.plan);

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
                    content: result.explanation,
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

    const deleteFile = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            await agentService.deleteFile(id);
            setFiles(prev => {
                const newFiles = prev.filter(f => f.id !== id);

                // If we deleted the active file, switch to the last available file or clear selection
                if (id === activeFileId) {
                    const nextFile = newFiles.length > 0 ? newFiles[newFiles.length - 1] : null;
                    setActiveFileId(nextFile ? nextFile.id : null);
                }

                return newFiles;
            });
        } catch (err) {
            setError('Failed to delete file on server');
        } finally {
            setIsLoading(false);
        }
    }, [activeFileId]);

    const resetProject = useCallback(async () => {
        setIsLoading(true);
        try {
            await agentService.resetState();
            await fetchData(); // Reload everything from server
            setActiveFileId('App.tsx');
        } catch (err) {
            setError('Failed to reset project on server');
        } finally {
            setIsLoading(false);
        }
    }, [fetchData]);

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
        deleteFile,
        resetProject
    };
}

