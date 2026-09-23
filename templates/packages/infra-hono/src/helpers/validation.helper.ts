import { flattenErrors, type Hook } from "@hono/standard-validator";
import type {
	Context,
	Env,
	Input,
	MiddlewareHandler,
	ValidationTargets,
} from "hono";
import type { InferInput } from "hono/validator";
import { validator } from "hono-openapi";
import { API_ERRORS } from "./apiErrors.helper.js";

type Issues = Parameters<typeof flattenErrors>[0];
type AnySchema = Parameters<typeof validator>[1];
type ValidatorOptions = Parameters<typeof validator>[3];
type SchemaTypes<S extends AnySchema> = NonNullable<S["~standard"]["types"]>;
type HasUndefined<T> = undefined extends T ? true : false;

/**
 * Turns a failed validation into the shared `{ code, error, details }` envelope
 * instead of the validator's default `{ success: false, error: [...] }` body.
 */
export const validationErrorHook = (
	result: { success: boolean; error?: Issues },
	c: Context,
) => {
	if (result.success || !result.error) return;
	const { payload, status } = API_ERRORS.VALIDATION_ERROR;
	return c.json({ ...payload, details: flattenErrors(result.error) }, status);
};

/**
 * Drop-in replacement for `validator` from `hono-openapi` that answers 400s
 * with the API error envelope. Use it in every controller.
 *
 * The generics mirror `validator`'s own signature so that RPC inference
 * (`hc<AppType>`) keeps seeing the validated input types.
 */
export const validate = <
	Schema extends AnySchema,
	Target extends keyof ValidationTargets,
	E extends Env,
	P extends string,
	In = SchemaTypes<Schema>["input"],
	Out = SchemaTypes<Schema>["output"],
	I extends Input = {
		in: HasUndefined<In> extends true
			? {
					[K in Target]?: [In] extends [ValidationTargets[K]]
						? In
						: InferInput<In, K>;
				}
			: {
					[K in Target]: [In] extends [ValidationTargets[K]]
						? In
						: InferInput<In, K>;
				};
		out: { [K in Target]: Out };
	},
	V extends I = I,
>(
	target: Target,
	schema: Schema,
	hook: Hook<SchemaTypes<Schema>["output"], E, P, Target> = validationErrorHook,
	options?: ValidatorOptions,
): MiddlewareHandler<E, P, V> =>
	validator<Schema, Target, E, P, In, Out, I, V>(target, schema, hook, options);
