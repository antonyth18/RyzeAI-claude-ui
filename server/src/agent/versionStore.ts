export interface Version {
    id: string;
    prompt: string;
    plan: any;
    code: string;
    explanation: string;
    timestamp: string;
}

let versions: Version[] = [];
let currentVersionId: string | null = null;

export const addVersion = (prompt: string, plan: any, code: string, explanation: string): Version => {
    const id = `${Date.now()}-${versions.length}`;
    const newVersion: Version = {
        id,
        prompt,
        plan,
        code,
        explanation,
        timestamp: new Date().toISOString()
    };
    versions.push(newVersion);
    currentVersionId = id;
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
};
