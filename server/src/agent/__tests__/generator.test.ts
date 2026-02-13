import { runGenerator, _resetGeneratorModel } from '../generator';
import Groq from 'groq-sdk';

// Mock Groq SDK
jest.mock('groq-sdk');

const MockGroq = Groq as jest.MockedClass<typeof Groq>;

describe('runGenerator (Groq)', () => {
    let mockCreate: jest.Mock;

    beforeEach(() => {
        _resetGeneratorModel();
        mockCreate = jest.fn();

        const mockGroqInstance = {
            chat: {
                completions: {
                    create: mockCreate
                }
            }
        };

        MockGroq.mockImplementation(() => mockGroqInstance as any);
        process.env.GROQ_API_KEY = 'test-key';
    });

    it('should return valid React code when Groq returns correct format', async () => {
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

        mockCreate.mockResolvedValue({
            choices: [{ message: { content: validCode } }]
        });

        const result = await runGenerator("intent", "plan");
        expect(result).toContain("export default function GeneratedComponent()");
        expect(result).toContain("<Card>");
        expect(result).toContain("<Button>");
    });

    it('should strip markdown fences', async () => {
        const codeWithFences = "```tsx\nimport React from 'react';\nexport default function Test() { return <div></div>; }\n```";

        mockCreate.mockResolvedValue({
            choices: [{ message: { content: codeWithFences } }]
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

        mockCreate.mockResolvedValue({
            choices: [{ message: { content: codeWithStyles } }]
        });

        await expect(runGenerator("intent", "plan")).rejects.toThrow(/inline styles are strictly forbidden/i);
    });

    it('should handle Groq 429 status code', async () => {
        const error: any = new Error("Rate limit exceeded");
        error.status = 429;

        mockCreate.mockRejectedValue(error);

        await expect(runGenerator("intent", "plan")).rejects.toThrow(/Rate Limit Exceeded/i);
    });
});
