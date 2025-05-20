import { Pool } from "pg";

// Initialize the PostgreSQL pool
export const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING,
});

// Create table schemas if they don't exist
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS expense_payment_methods (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        last_four_digits TEXT,
        is_default BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        amount DECIMAL NOT NULL,
        description TEXT NOT NULL,
        category_id TEXT REFERENCES expense_categories(id),
        payment_method_id TEXT REFERENCES expense_payment_methods(id),
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        merchant TEXT,
        currency TEXT DEFAULT 'USD',
        items JSONB,
        tax DECIMAL,
        tip DECIMAL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
