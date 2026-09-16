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
  pgm.addColumn('registrations', {
    checked_in: {
      type: 'boolean',
      default: false,
      notNull: true,
    }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('registrations', 'checked_in');
};
