import pg from 'npm:pg';
const { Pool } = pg;

const {
  PGUSER,
  PGPASSWORD,
  PGHOST,
  PGPORT,
  PGDATABASE,
} = Deno.env.toObject();

const pool = new Pool({
  PGUSER,
  PGPASSWORD,
  PGHOST,
  PGPORT,
  PGDATABASE
});

export { pool };
