-- Add attorney_email column to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN attorney_email TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN subscriptions.attorney_email IS 'Email address used to identify attorney messages in email chain analysis for billable time estimation';
