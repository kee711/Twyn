-- Ensure UUID generation available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id text NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_public boolean NOT NULL DEFAULT FALSE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS personas_user_account_name_idx
    ON personas(user_account_id, lower(name));

-- Audiences table
CREATE TABLE IF NOT EXISTS audiences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id text NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_public boolean NOT NULL DEFAULT FALSE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS audiences_user_account_name_idx
    ON audiences(user_account_id, lower(name));

-- Objectives table
CREATE TABLE IF NOT EXISTS objectives (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id text NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_public boolean NOT NULL DEFAULT FALSE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS objectives_user_account_name_idx
    ON objectives(user_account_id, lower(name));

-- Add-ons table (user_account_id nullable for global items)
CREATE TABLE IF NOT EXISTS add_ons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id text REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_public boolean NOT NULL DEFAULT FALSE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS add_ons_owner_name_idx
    ON add_ons(COALESCE(user_account_id, 'GLOBAL'), lower(name));

-- Store last-used selections per account
CREATE TABLE IF NOT EXISTS topic_finder_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id text NOT NULL UNIQUE REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
    audience_id uuid REFERENCES audiences(id) ON DELETE SET NULL,
    objective_id uuid REFERENCES objectives(id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Link table for selected add-ons per preference
CREATE TABLE IF NOT EXISTS topic_finder_preference_add_ons (
    preference_id uuid NOT NULL REFERENCES topic_finder_preferences(id) ON DELETE CASCADE,
    add_on_id uuid NOT NULL REFERENCES add_ons(id) ON DELETE CASCADE,
    last_selected_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (preference_id, add_on_id)
);

-- Trigger function to update updated_at timestamps
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personas_updated_at_trg
BEFORE UPDATE ON personas
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER audiences_updated_at_trg
BEFORE UPDATE ON audiences
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER objectives_updated_at_trg
BEFORE UPDATE ON objectives
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER add_ons_updated_at_trg
BEFORE UPDATE ON add_ons
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER topic_finder_preferences_updated_at_trg
BEFORE UPDATE ON topic_finder_preferences
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
