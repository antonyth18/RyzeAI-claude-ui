import { UITree } from './uiTree';
import fs from 'fs';
import path from 'path';

export interface Version {
    id: string;
    prompt: string;
    plan: any;
    code: string;
    tree: UITree | null; // Nullable for backwards compatibility with old versions
    explanation: string;
    timestamp: string;
}

const DB_DIR = path.join(__dirname, '../../db');
const DB_PATH = path.join(DB_DIR, 'versions.json');

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Map of fileName -> Version[]
let fileVersions: Record<string, Version[]> = {};
let currentVersionIds: Record<string, string | null> = {};

const saveVersions = () => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(fileVersions, null, 2));
    } catch (error) {
        console.error("Failed to save versions:", error);
    }
};

const loadVersions = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            fileVersions = JSON.parse(data);

            // Re-initialize currentVersionIds from loaded history
            for (const fileName in fileVersions) {
                const versions = fileVersions[fileName];
                if (versions && versions.length > 0) {
                    currentVersionIds[fileName] = versions[versions.length - 1].id;
                }
            }
        }
    } catch (error) {
        console.error("Failed to load versions:", error);
        fileVersions = {};
    }
};

// Load versions on startup
loadVersions();

// If file didn't exist, we should save the default (empty) versions
if (!fs.existsSync(DB_PATH)) {
    saveVersions();
}

export const addVersion = (fileName: string, prompt: string, plan: any, code: string, tree: UITree | null, explanation: string): Version => {
    if (!fileVersions[fileName]) {
        fileVersions[fileName] = [];
    }

    const id = `${Date.now()}-${fileVersions[fileName].length}`;
    const newVersion: Version = {
        id,
        prompt,
        plan,
        code,
        tree,
        explanation,
        timestamp: new Date().toISOString()
    };

    fileVersions[fileName].push(newVersion);
    currentVersionIds[fileName] = id;
    saveVersions();
    return newVersion;
};

export const getCurrent = (fileName: string): Version | null => {
    const currentId = currentVersionIds[fileName];
    if (!currentId) return null;
    return fileVersions[fileName]?.find(v => v.id === currentId) || null;
};

export const rollback = (fileName: string, id: string): Version | null => {
    const version = fileVersions[fileName]?.find(v => v.id === id);
    if (version) {
        currentVersionIds[fileName] = id;
        return version;
    }
    return null;
};

export const getAllVersions = (fileName: string): Version[] => {
    return fileVersions[fileName] || [];
};

export const clearVersions = (fileName?: string) => {
    if (fileName) {
        delete fileVersions[fileName];
        delete currentVersionIds[fileName];
    } else {
        fileVersions = {};
        currentVersionIds = {};
    }
    saveVersions();
};

