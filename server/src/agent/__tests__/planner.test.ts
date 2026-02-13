import { runPlanner, _resetModel } from '../planner';
import Groq from 'groq-sdk';

// Mock Groq SDK
jest.mock('groq-sdk');

const MockGroq = Groq as jest.MockedClass<typeof Groq>;

describe('runPlanner (Groq)', () => {
    let mockCreate: jest.Mock;

    beforeEach(() => {
        _resetModel(); // Clear cached groq instance
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

    it('should return a valid JSON plan when Groq returns correct format', async () => {
        const mockResponseText = JSON.stringify({
            intent: "Build a login page",
            steps: ["Step 1"],
            componentsToUse: ["Card", "Button", "Input"],
            layoutStrategy: "Centered column",
            explanation: "Standard login layout"
        });

        mockCreate.mockResolvedValue({
            choices: [{ message: { content: mockResponseText } }]
        });

        const result = await runPlanner("Build a login page");
        const parsed = JSON.parse(result);

        expect(parsed.intent).toBe("Build a login page");
        expect(parsed.componentsToUse).toContain("Card");
    });

    it('should reject if Groq returns unknown component types', async () => {
        const mockResponseText = JSON.stringify({
            intent: "Build a page",
            steps: ["Step 1"],
            componentsToUse: ["UnknownComponent"],
            layoutStrategy: "Strategy",
            explanation: "Explanation"
        });

        mockCreate.mockResolvedValue({
            choices: [{ message: { content: mockResponseText } }]
        });

        await expect(runPlanner("intent")).rejects.toThrow(/unknown component types/);
    });

    it('should handle 429 status code', async () => {
        const error: any = new Error("Rate limit exceeded");
        error.status = 429;

        mockCreate.mockRejectedValue(error);

        await expect(runPlanner("intent")).rejects.toThrow(/Rate Limit Exceeded/);
    });
});
