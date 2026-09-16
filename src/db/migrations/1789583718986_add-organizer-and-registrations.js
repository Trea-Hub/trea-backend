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
  pgm.addColumn('events', {
    organizer: { type: 'varchar(56)' },
  });

  pgm.createTable('registrations', {
    id: { type: 'varchar(1000)', primaryKey: true },
    event_id: {
      type: 'varchar(1000)',
      notNull: true,
      references: '"events"',
      onDelete: 'CASCADE',
    },
    attendee_address: { type: 'varchar(56)', notNull: true },
    paid_amount: { type: 'varchar(255)' },
    check_in_status: { type: 'boolean', default: false },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('registrations');
  pgm.dropColumn('events', 'organizer');
};
