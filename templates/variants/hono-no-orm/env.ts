import { z } from "zod";

const envSchema = z.object({
	FRONTEND_URL: z.url(),
});

export const env = envSchema.parse(process.env);
