CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS paint_schema;

ALTER ROLE dbuser SET search_path TO paint_schema;
