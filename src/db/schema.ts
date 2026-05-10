import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const secrets = sqliteTable('secrets', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  encryptedContent: text('encrypted_content'),
  fileKey: text('file_key'),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  fileType: text('file_type'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  burnOnRead: integer('burn_on_read', { mode: 'boolean' }).notNull().default(true),
});

export const apiKeys = sqliteTable('api_keys', {
  key: text('key').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
