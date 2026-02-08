-- Templates feature: tables, indexes, RLS policies, and triggers

-- templates table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client TEXT,
  matter TEXT,
  time_amount DECIMAL(10, 2) CHECK (time_amount IS NULL OR (time_amount >= 0.1 AND time_amount <= 24)),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX templates_user_id_idx ON templates(user_id);
CREATE INDEX templates_user_id_name_idx ON templates(user_id, name);

-- template_tags table
CREATE TABLE template_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE INDEX template_tags_user_id_idx ON template_tags(user_id);

-- template_tag_assignments table (many-to-many)
CREATE TABLE template_tag_assignments (
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES template_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, tag_id)
);

-- RLS policies
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own templates" ON templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE template_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own tags" ON template_tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE template_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own assignments" ON template_tag_assignments
  FOR ALL USING (
    template_id IN (SELECT id FROM templates WHERE user_id = auth.uid())
  ) WITH CHECK (
    template_id IN (SELECT id FROM templates WHERE user_id = auth.uid())
  );

-- Auto-update updated_at on templates
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
