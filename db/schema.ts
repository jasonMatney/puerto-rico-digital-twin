import {
  sqliteTable,
  text,
  index,
  integer,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
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

export const publications = sqliteTable(
  'publications',
  {
    sequence: integer('sequence').primaryKey({ autoIncrement: true }),
    id: text('id').notNull().unique(),
    ownerId: text('owner_id').notNull(),
    shelterId: text('shelter_id').notNull(),
    reviewId: text('review_id').notNull(),
    previousId: text('previous_id').notNull(),
    createdAt: text('created_at').notNull(),
    before: text('before').notNull(),
    after: text('after').notNull(),
  },
  (t) => [
    index('idx_publications_owner_shelter_sequence').on(
      t.ownerId,
      t.shelterId,
      t.sequence,
    ),
    uniqueIndex('idx_publications_owner_review').on(t.ownerId, t.reviewId),
  ],
);
