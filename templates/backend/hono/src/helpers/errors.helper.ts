import { API_ERROR } from "@monorepo-template/common/constants";
import type { LogsBindings } from "@monorepo-template/infra/factories";
import { apiError } from "@monorepo-template/infra/helpers";
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Single place where errors become HTTP responses. Every branch answers with
 * the `{ code, error }` envelope so the frontend can rely on one shape.
 */
export const errorHandler: ErrorHandler<LogsBindings> = (err, c) => {
	if (err instanceof HTTPException) {
		// A middleware that built its own Response (e.g. auth headers) keeps it.
		if (err.res) return err.getResponse();
		return c.json(
			{ code: API_ERROR.HTTP_ERROR, error: err.message || "Request failed" },
			err.status,
		);
	}

	c.get("logger").error({ err }, "Internal server error");
	return apiError(c, "INTERNAL_ERROR");
};
