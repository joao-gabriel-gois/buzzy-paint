CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  refresh_token TEXT NOT NULL,
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

DO $body$
BEGIN
  -- Check if the trigger exists for user_tokens
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'set_timestamp' AND tgrelid = 'user_tokens'::regclass
  ) THEN
    -- Create the trigger if it does not exist
    EXECUTE '
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON user_tokens
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();';
  END IF;
END;
$body$;