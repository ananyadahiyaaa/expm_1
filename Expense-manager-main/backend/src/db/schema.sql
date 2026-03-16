-- Cloud-Based Expense Tracker - PostgreSQL Schema (RDS-ready)
-- Run this on RDS or local PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  category    VARCHAR(50) NOT NULL,
  description TEXT,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_budgets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month      INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year       INTEGER NOT NULL,
  amount     DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX idx_monthly_budgets_user ON monthly_budgets(user_id);
