import { z } from "zod";

/** Every non-2xx response from the API uses this envelope. */
export const ErrorSchema = z.object({
	code: z.string(),
	error: z.string(),
});

/** 400 from request validation: the envelope plus the flattened issues. */
export const ValidationErrorSchema = ErrorSchema.extend({
	details: z.object({
		formErrors: z.array(z.string()),
		fieldErrors: z.record(z.string(), z.array(z.string())),
	}),
});

export type ApiErrorBody = z.infer<typeof ErrorSchema>;
export type ValidationErrorBody = z.infer<typeof ValidationErrorSchema>;
