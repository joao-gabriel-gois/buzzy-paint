CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $body$
BEGIN
  -- Check if the function to update timestamp of updated_at exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'trigger_set_timestamp'
  ) THEN
    -- Create/Replace the function if it does not exist
    EXECUTE '
    CREATE OR REPLACE FUNCTION trigger_set_timestamp()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;';
  END IF;
  -- Check if the trigger exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_timestamp' AND tgrelid = 'users'::regclass
  ) THEN
    -- Create the trigger if it does not exist
    EXECUTE '
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();';
  END IF;
END;
$body$;
