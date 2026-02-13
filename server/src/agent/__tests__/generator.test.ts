import { runGenerator, _resetGeneratorModel } from '../generator';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Google Generative AI
jest.mock('@google/generative-ai');

const MockGenAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

describe('runGenerator (Gemini)', () => {
    let mockGenerateContent: jest.Mock;

    beforeEach(() => {
        _resetGeneratorModel();
        mockGenerateContent = jest.fn();

        const mockModel = {
            generateContent: mockGenerateContent
        };

        MockGenAI.prototype.getGenerativeModel.mockReturnValue(mockModel as any);
    });

    it('should return valid React code when Gemini returns correct format', async () => {
        const validCode = `
import React from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export default function GeneratedComponent() {
  return (
    <Card>
      <div className="p-4">
        <h1>Hello</h1>
        <Button>Click me</Button>
      </div>
    </Card>
  );
}
        `;

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => validCode
            }
        });

        const result = await runGenerator("intent", "plan");
        expect(result).toContain("export default function GeneratedComponent()");
        expect(result).toContain("<Card>");
        expect(result).toContain("<Button>");
    });

    it('should strip markdown fences', async () => {
        const codeWithFences = "```tsx\nimport React from 'react';\nexport default function Test() { return <div></div>; }\n```";

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => codeWithFences
            }
        });

        const result = await runGenerator("intent", "plan");
        expect(result).not.toContain("```");
        expect(result).toContain("export default function Test()");
    });

    it('should reject code with inline styles', async () => {
        const codeWithStyles = `
import React from 'react';
export default function Test() {
  return <div style={{ color: 'red' }}>Style</div>;
}
        `;

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => codeWithStyles
            }
        });

        await expect(runGenerator("intent", "plan")).rejects.toThrow(/inline styles are strictly forbidden/i);
    });

    it('should reject code with unknown components', async () => {
        const codeWithUnknown = `
import React from 'react';
import { SecretComponent } from './Secret';

export default function Test() {
  return <SecretComponent>Secret</SecretComponent>;
}
        `;

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => codeWithUnknown
            }
        });

        await expect(runGenerator("intent", "plan")).rejects.toThrow(/unknown or disallowed components detected/i);
    });

    it('should reject code with disallowed imports', async () => {
        const codeWithBadImport = `
import React from 'react';
import axios from 'axios';

export default function Test() {
  return <div>No axios allowed</div>;
}
        `;

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => codeWithBadImport
            }
        });

        await expect(runGenerator("intent", "plan")).rejects.toThrow(/external or disallowed imports detected/i);
    });
});
