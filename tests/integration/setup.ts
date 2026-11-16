import "dotenv/config";
import { assertTestDatabase } from "../test-database";

// Prisma reads DATABASE_URL, so the test process is pointed at the disposable
// database only after the guard has verified it.
process.env.DATABASE_URL = assertTestDatabase(process.env);
