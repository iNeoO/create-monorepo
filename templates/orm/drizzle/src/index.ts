import { env } from "@monorepo-template/infra/configs";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import * as schema from "./db/schema.js";

export {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	ilike,
	inArray,
	isNotNull,
	isNull,
	lt,
	lte,
	ne,
	not,
	or,
	sql,
} from "drizzle-orm";
export { drizzle, schema };

// Explicit annotation: TS 7 refuses to emit a declaration for the inferred type
// because it would reference `Pool` from @types/pg (TS2883).
export type Database = NodePgDatabase<typeof schema.relations> & {
	$client: Pool;
};
export const db: Database = drizzle(env.PG_URL, {
	relations: schema.relations,
});
