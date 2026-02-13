import * as versionStore from '../versionStore';

describe('VersionStore', () => {
    beforeEach(() => {
        versionStore.clearVersions();
    });

    it('should add a version and set it as current', () => {
        const plan = { intent: 'test plan' };
        const code = 'const Test = () => {}';
        const explanation = 'test explanation';

        const version = versionStore.addVersion(plan, code, explanation);

        expect(version.id).toBeDefined();
        expect(version.plan).toEqual(plan);
        expect(version.code).toBe(code);
        expect(version.explanation).toBe(explanation);
        expect(versionStore.getCurrent()).toEqual(version);
    });

    it('should allow rolling back to a previous version', () => {
        const v1 = versionStore.addVersion({ i: 1 }, 'c1', 'e1');
        const v2 = versionStore.addVersion({ i: 2 }, 'c2', 'e2');

        expect(versionStore.getCurrent()).toEqual(v2);

        const rolledBack = versionStore.rollback(v1.id);
        expect(rolledBack).toEqual(v1);
        expect(versionStore.getCurrent()).toEqual(v1);
    });

    it('should return null for non-existent version rollback', () => {
        const result = versionStore.rollback('non-existent');
        expect(result).toBeNull();
    });

    it('should get all versions', () => {
        versionStore.addVersion({ i: 1 }, 'c1', 'e1');
        versionStore.addVersion({ i: 2 }, 'c2', 'e2');

        expect(versionStore.getAllVersions().length).toBe(2);
    });
});
