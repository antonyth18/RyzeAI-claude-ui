import { runExplainer, _resetExplainerModel } from '../explainer';
import Groq from 'groq-sdk';

// Mock Groq SDK
jest.mock('groq-sdk');

const MockGroq = Groq as jest.MockedClass<typeof Groq>;

describe('runExplainer (Groq)', () => {
    let mockCreate: jest.Mock;

    beforeEach(() => {
        _resetExplainerModel();
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

    it('should return plain English explanation for new component', async () => {
        const mockExplanation = "I selected a centered layout to focus the user's attention. The Button component is used for primary actions.";

        mockCreate.mockResolvedValue({
            choices: [{ message: { content: mockExplanation } }]
        });

        const result = await runExplainer("Build a login form", "{}");
        expect(result).toBe(mockExplanation);
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            messages: expect.arrayContaining([
                expect.objectContaining({ content: expect.stringContaining("This is a new component request.") })
            ])
        }));
    });

    it('should return plain English explanation for iterative update', async () => {
        const mockExplanation = "I updated the Button color to provide better contrast as per the new plan.";

        mockCreate.mockResolvedValue({
            choices: [{ message: { content: mockExplanation } }]
        });

        const result = await runExplainer("Change button color", "current plan", "previous plan");
        expect(result).toBe(mockExplanation);
        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            messages: expect.arrayContaining([
                expect.objectContaining({ content: expect.stringContaining("Previous Design Plan Context:") })
            ])
        }));
    });

    it('should throw error if Groq fails', async () => {
        mockCreate.mockRejectedValue(new Error("API Error"));

        await expect(runExplainer("intent", "plan")).rejects.toThrow("API Error");
    });
});
