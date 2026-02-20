/**
 * Simple utility for retrying asynchronous functions with exponential backoff.
 * Primarily used to handle Groq API rate limit (429) errors.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 2000
): Promise<T> {
    let retries = 0;

    while (true) {
        try {
            return await fn();
        } catch (error: any) {
            // Check if it's a rate limit error (status 429)
            const isRateLimit = error.status === 429 || (error.message && error.message.includes("429"));

            if (isRateLimit && retries < maxRetries) {
                retries++;
                // Exponential backoff: 2s, 4s, 8s...
                const delay = initialDelay * Math.pow(2, retries - 1);

                console.warn(`[Groq Retry] Rate limit hit. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);

                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // If not a rate limit error or we've exhausted retries, rethrow
            throw error;
        }
    }
}
