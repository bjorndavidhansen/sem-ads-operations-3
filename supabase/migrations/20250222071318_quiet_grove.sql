/*
  # Task Templates and Schedules

  1. New Tables
    - `task_templates`
      - `template_id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text)
      - `task_type` (text)
      - `configuration_json` (jsonb)
      - Timestamps (created_at, updated_at)

    - `task_schedules`
      - `schedule_id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `template_id` (uuid, references task_templates)
      - `name` (text)
      - `description` (text)
      - `cron_expression` (text)
      - `timezone` (text)
      - `is_active` (boolean)
      - `last_run` (timestamptz)
      - `next_run` (timestamptz)
      - `configuration_json` (jsonb)
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create task templates table
CREATE TABLE IF NOT EXISTS task_templates (
  template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  task_type text NOT NULL CHECK (task_type IN ('COPY_CAMPAIGN', 'CONVERT_MATCH_TYPES', 'CREATE_BSP')),
  configuration_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for task_templates
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for task_templates
CREATE POLICY "Users can read their own templates"
  ON task_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create templates"
  ON task_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON task_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON task_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create task schedules table
CREATE TABLE IF NOT EXISTS task_schedules (
  schedule_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  template_id uuid NOT NULL REFERENCES task_templates(template_id),
  name text NOT NULL,
  description text,
  cron_expression text NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  is_active boolean NOT NULL DEFAULT true,
  last_run timestamptz,
  next_run timestamptz,
  configuration_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for task_schedules
ALTER TABLE task_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for task_schedules
CREATE POLICY "Users can read their own schedules"
  ON task_schedules
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create schedules"
  ON task_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
  ON task_schedules
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON task_schedules
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_task_templates_user ON task_templates(user_id);
CREATE INDEX idx_task_schedules_user ON task_schedules(user_id);
CREATE INDEX idx_task_schedules_template ON task_schedules(template_id);
CREATE INDEX idx_task_schedules_next_run ON task_schedules(next_run);

-- Create updated_at triggers
CREATE TRIGGER update_task_templates_updated_at
  BEFORE UPDATE ON task_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_schedules_updated_at
  BEFORE UPDATE ON task_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();