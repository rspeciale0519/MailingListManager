import { createClient } from '@libsql/client';

// Initialize the database client
export const db = createClient({
  url: process.env.DATABASE_URL || 'file:./data.db',
});

// Initialize the database schema if it doesn't exist
export async function initializeDb() {
  // Create users table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Create campaigns table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create uploaded_lists table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS uploaded_lists (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_headers TEXT NOT NULL,
      mapped_headers TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create records table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (list_id) REFERENCES uploaded_lists(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create segments table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS segments (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      filter_conditions TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create system_headers table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS system_headers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_required BOOLEAN NOT NULL DEFAULT 0
    )
  `);

  // Insert default system headers if they don't exist
  const systemHeaders = await db.execute('SELECT COUNT(*) as count FROM system_headers');
  if (systemHeaders.rows[0].count === 0) {
    const defaultHeaders = [
      { id: crypto.randomUUID(), name: 'Email', isRequired: true },
      { id: crypto.randomUUID(), name: 'First Name', isRequired: false },
      { id: crypto.randomUUID(), name: 'Last Name', isRequired: false },
      { id: crypto.randomUUID(), name: 'Phone', isRequired: false },
      { id: crypto.randomUUID(), name: 'Address', isRequired: false },
      { id: crypto.randomUUID(), name: 'City', isRequired: false },
      { id: crypto.randomUUID(), name: 'State', isRequired: false },
      { id: crypto.randomUUID(), name: 'Zip', isRequired: false },
      { id: crypto.randomUUID(), name: 'Country', isRequired: false },
      { id: crypto.randomUUID(), name: 'Company', isRequired: false },
      { id: crypto.randomUUID(), name: 'Job Title', isRequired: false },
    ];

    for (const header of defaultHeaders) {
      await db.execute({
        sql: 'INSERT INTO system_headers (id, name, is_required) VALUES (?, ?, ?)',
        args: [header.id, header.name, header.isRequired ? 1 : 0]
      });
    }
  }
}
