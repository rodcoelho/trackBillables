-- Create the billables table
CREATE TABLE IF NOT EXISTS billables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  client_project TEXT NOT NULL,
  time_amount DECIMAL(10, 2) NOT NULL CHECK (time_amount >= 0.1),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS billables_user_id_idx ON billables(user_id);

-- Create index on date for faster sorting
CREATE INDEX IF NOT EXISTS billables_date_idx ON billables(date DESC);

-- Create composite index for user-specific queries ordered by date
CREATE INDEX IF NOT EXISTS billables_user_date_idx ON billables(user_id, date DESC);

-- Enable Row Level Security
ALTER TABLE billables ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only view their own billables
CREATE POLICY "Users can view own billables"
  ON billables
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own billables
CREATE POLICY "Users can insert own billables"
  ON billables
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own billables
CREATE POLICY "Users can update own billables"
  ON billables
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own billables
CREATE POLICY "Users can delete own billables"
  ON billables
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER update_billables_updated_at
  BEFORE UPDATE ON billables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for the billables table
ALTER PUBLICATION supabase_realtime ADD TABLE billables;
