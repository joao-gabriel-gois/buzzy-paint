#!/bin/sh
set -e

until PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c '\q'; do
  >&2 echo "(entrypoint.sh): Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "(entrypoint.sh): Postgres is up - running migrations"
deno task migrate

>&2 echo "(entrypoint.sh): Migrations completed - starting the application"
deno task prod
