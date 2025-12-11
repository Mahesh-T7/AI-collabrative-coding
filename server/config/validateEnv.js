import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().transform(Number).default('5001'),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    CLIENT_URL: z.string().url().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const validateEnv = () => {
    try {
        const env = envSchema.parse(process.env);
        return env;
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Invalid environment variables:');
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
};

export const env = validateEnv();
