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
    registered_count: {
      type: 'integer',
      default: 0,
      notNull: true,
    }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('events', 'registered_count');
};
