/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.hasTable('organization').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('organization', function(table) {
        table.integer('org_id').primary();
        table.string('org_name').notNullable();
        table.text('org_description');
        table.string('org_abbrevation');
        table.text('org_address');
        table.string('org_contact_no');
        table.integer('org_parent');
        table.timestamps(true, true);
      });
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('organization');
};
