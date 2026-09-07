import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const verifications = sqliteTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    shelterId: text('shelter_id').notNull(),
    createdAt: text('created_at').notNull(),
    payload: text('payload').notNull(),
  },
  (t) => [
    index('idx_verifications_owner_shelter_time').on(
      t.ownerId,
      t.shelterId,
      t.createdAt,
    ),
  ],
);
