export type ValidationDetails = {
	formErrors: string[];
	fieldErrors: Record<string, string[]>;
};

/** Mirrors the API error envelope `{ code, error, details? }`. */
export class ApiError extends Error {
	readonly code: string;
	readonly status: number;
	readonly details: ValidationDetails | undefined;

	constructor(
		code: string,
		message: string,
		status: number,
		details?: ValidationDetails,
	) {
		super(message);
		this.name = "ApiError";
		this.code = code;
		this.status = status;
		this.details = details;
	}
}

export async function toApiError(
	res: Response,
	fallbackMessage: string,
): Promise<ApiError> {
	try {
		const json = (await res.json()) as {
			code?: string;
			error?: string;
			details?: ValidationDetails;
		};
		return new ApiError(
			json.code ?? "UNKNOWN_ERROR",
			json.error ?? fallbackMessage,
			res.status,
			json.details,
		);
	} catch {
		return new ApiError("UNKNOWN_ERROR", fallbackMessage, res.status);
	}
}
