import { dirname, fromFileUrl, join, resolve } from "https://deno.land/std@0.224.0/path/mod.ts";
import { pool } from "@shared/infra/postgres/config.ts";
const __dirname = dirname(fromFileUrl(import.meta.url))

const logger = console; // we can create a different logger utils later, let"s use console for now
const directoryPath = resolve(__dirname, "migrations");

async function executeSqlFile(filePath: string, counter: number) {
  try {
    // await pool.query("BEGIN");
    const query = Deno.readTextFileSync(filePath);
    await pool.query(query);
    // await pool.query("COMMIT");
    // logger.info("Migration", res); // for debugging put "await pool.query();" calls inside a variable
    logger.info(`(migrate.ts script): Migration ${counter} has been executed successfully`);
  } catch (err) {
    await pool.query("ROLLBACK");
    logger.error(`(migrate.ts script): Error executing ${filePath}:`, err);
  }
}

// Recursive function to read directories and find SQL files
async function traverseDirectories(dirPath: string) {
  let counter: number = 0;
  for await (const entry of Deno.readDir(dirPath)) {
    const entryPath = join(dirPath, entry.name);
    if (entry.isDirectory) {
      await traverseDirectories(entryPath);
    } else if (entry.isFile && entry.name.endsWith(".sql")) {
      counter++;
      await executeSqlFile(entryPath, counter);
    }
  }
}

traverseDirectories(directoryPath)
  .then(() => {
    pool.end();
  })
  .catch(err => {
    logger.error("(migrate.ts script): Failed during traversing migrations directory:", err);
    pool.end();
  });
