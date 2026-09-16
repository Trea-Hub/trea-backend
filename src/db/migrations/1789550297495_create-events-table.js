/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('events', {
    id: { type: 'varchar(1000)', primaryKey: true },
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    location: { type: 'varchar(255)' },
    date: { type: 'timestamp' },
    is_free: { type: 'boolean', default: false },
    tags: { type: 'varchar(255)[]' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('events');
};
