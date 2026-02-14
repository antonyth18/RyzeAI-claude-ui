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

let versions: Version[] = [];
let currentVersionId: string | null = null;

const saveVersions = () => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(versions, null, 2));
    } catch (error) {
        console.error("Failed to save versions:", error);
    }
};

const loadVersions = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            versions = JSON.parse(data);
            if (versions.length > 0) {
                currentVersionId = versions[versions.length - 1].id;
            }
        }
    } catch (error) {
        console.error("Failed to load versions:", error);
        versions = [];
    }
};

// Load versions on startup
loadVersions();

// If file didn't exist, we should save the default (empty) versions
if (!fs.existsSync(DB_PATH)) {
    saveVersions();
}

export const addVersion = (prompt: string, plan: any, code: string, tree: UITree, explanation: string): Version => {
    const id = `${Date.now()}-${versions.length}`;
    const newVersion: Version = {
        id,
        prompt,
        plan,
        code,
        tree,
        explanation,
        timestamp: new Date().toISOString()
    };
    versions.push(newVersion);
    currentVersionId = id;
    saveVersions();
    return newVersion;
};

export const getCurrent = (): Version | null => {
    if (!currentVersionId) return null;
    return versions.find(v => v.id === currentVersionId) || null;
};

export const rollback = (id: string): Version | null => {
    const version = versions.find(v => v.id === id);
    if (version) {
        currentVersionId = id;
        // In a real implementation, we might want to "branch" here or just set current
        // For now, setting current is enough for the simple Linear history
        return version;
    }
    return null;
};

export const getAllVersions = (): Version[] => {
    return versions;
};

export const clearVersions = () => {
    versions = [];
    currentVersionId = null;
    saveVersions();
};
