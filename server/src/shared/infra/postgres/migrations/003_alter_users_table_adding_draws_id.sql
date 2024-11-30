DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='draws_mongo_id') THEN 
    ALTER TABLE users ADD COLUMN draws_mongo_id TEXT UNIQUE; 
  END IF; 
END $$;
