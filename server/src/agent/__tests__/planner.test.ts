import { runPlanner, _resetModel } from '../planner';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Google Generative AI
jest.mock('@google/generative-ai');

const MockGenAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

describe('runPlanner (Gemini)', () => {
    let mockGenerateContent: jest.Mock;

    beforeEach(() => {
        _resetModel(); // Clear cached model in planner.ts
        mockGenerateContent = jest.fn();

        const mockModel = {
            generateContent: mockGenerateContent
        };

        MockGenAI.prototype.getGenerativeModel = jest.fn().mockReturnValue(mockModel);

        process.env.GOOGLE_API_KEY = 'test-key';
    });

    it('should return a valid JSON plan when Gemini returns correct format', async () => {
        const mockResponseText = JSON.stringify({
            intent: "Build a login page",
            steps: ["Step 1"],
            componentsToUse: ["Card", "Button", "Input"],
            layoutStrategy: "Centered column",
            explanation: "Standard login layout"
        });

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => mockResponseText
            }
        });

        const result = await runPlanner("Build a login page");
        const parsed = JSON.parse(result);

        expect(parsed.intent).toBe("Build a login page");
        expect(parsed.componentsToUse).toContain("Card");
    });

    it('should handle Gemini markdown fences', async () => {
        const mockResponseText = "```json\n" + JSON.stringify({
            intent: "Build a page",
            steps: ["Step 1"],
            componentsToUse: ["Card"],
            layoutStrategy: "Strategy",
            explanation: "Explanation"
        }) + "\n```";

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => mockResponseText
            }
        });

        const result = await runPlanner("intent");
        const parsed = JSON.parse(result);
        expect(parsed.intent).toBe("Build a page");
    });

    it('should reject if Gemini returns unknown component types', async () => {
        const mockResponseText = JSON.stringify({
            intent: "Build a page",
            steps: ["Step 1"],
            componentsToUse: ["UnknownComponent"],
            layoutStrategy: "Strategy",
            explanation: "Explanation"
        });

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => mockResponseText
            }
        });

        await expect(runPlanner("intent")).rejects.toThrow(/unknown component types/);
    });

    it('should reject if Gemini returns content with JSX characters', async () => {
        const mockResponseText = JSON.stringify({
            intent: "Build <jsx /> page",
            steps: ["Step 1"],
            componentsToUse: ["Card"],
            layoutStrategy: "Strategy",
            explanation: "Explanation"
        });

        mockGenerateContent.mockResolvedValue({
            response: {
                text: () => mockResponseText
            }
        });

        await expect(runPlanner("intent")).rejects.toThrow(/strictly forbidden/);
    });
});
