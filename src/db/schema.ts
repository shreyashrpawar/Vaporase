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
  status: text('status').notNull().default('active'), // active, burned, revoked
  passwordHash: text('password_hash'),
  allowedIp: text('allowed_ip'),
  isE2EE: integer('is_e2ee', { mode: 'boolean' }).notNull().default(false),
  readAt: integer('read_at', { mode: 'timestamp' }),
  readByIp: text('read_by_ip'),
  readLocation: text('read_location'),
  recipientId: text('recipient_id'), // To distinguish between sent vs. received secrets
  dropKey: text('drop_key'), // Server-stored key for drop box secrets (not E2EE)
  alias: text('alias'), // Custom human-readable alias
  senderIp: text('sender_ip'), // IP of the person who sent the secret
});

export const userProfiles = sqliteTable('user_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(), // Clerk user ID
  subdomain: text('subdomain').notNull().unique(), // e.g., 'shreyash'
  displayName: text('display_name').notNull(),
  plan: text('plan').notNull().default('free'), // free, pro
  planExpiresAt: integer('plan_expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const apiKeys = sqliteTable('api_keys', {
  key: text('key').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
