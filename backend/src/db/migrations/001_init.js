export async function up(knex) {
  await knex.schema.createTable('couriers', (table) => {
    table.uuid('id').primary();
    table.string('work_id').notNullable().unique();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('avatar_url');
    table.string('team');
    table.float('rate').notNullable().defaultTo(0);
    table.integer('level').notNullable().defaultTo(1);
    table.string('transportation');
    table.string('vehicle_number');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('shifts', (table) => {
    table.uuid('id').primary();
    table.uuid('courier_id').notNullable();
    table.foreign('courier_id').references('couriers.id').onDelete('CASCADE');
    table.timestamp('started_at').notNullable();
    table.timestamp('ended_at');
    table.string('status').notNullable();
    table.float('earnings').notNullable().defaultTo(0);
    table.float('tips').notNullable().defaultTo(0);
    table.integer('deliveries_completed').notNullable().defaultTo(0);
  });

  await knex.schema.createTable('orders', (table) => {
    table.uuid('id').primary();
    table.string('order_number').notNullable().unique();
    table.uuid('courier_id');
    table.uuid('shift_id');
    table.foreign('courier_id').references('couriers.id').onDelete('SET NULL');
    table.foreign('shift_id').references('shifts.id').onDelete('SET NULL');
    table.string('status').notNullable();
    table.string('pickup_name').notNullable();
    table.string('pickup_address').notNullable();
    table.string('destination_name').notNullable();
    table.string('destination_address').notNullable();
    table.string('customer_name');
    table.string('customer_phone');
    table.float('total').notNullable().defaultTo(0);
    table.string('payment_method');
    table.float('courier_earn').notNullable().defaultTo(0);
    table.float('tip').notNullable().defaultTo(0);
    table.timestamp('eta_time');
    table.float('distance_left_km').notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('order_items', (table) => {
    table.uuid('id').primary();
    table.uuid('order_id').notNullable();
    table.foreign('order_id').references('orders.id').onDelete('CASCADE');
    table.string('name').notNullable();
    table.float('price').notNullable().defaultTo(0);
    table.string('note');
  });

  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary();
    table.uuid('courier_id').notNullable();
    table.uuid('order_id');
    table.foreign('courier_id').references('couriers.id').onDelete('CASCADE');
    table.foreign('order_id').references('orders.id').onDelete('SET NULL');
    table.string('type').notNullable();
    table.float('amount').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('messages', (table) => {
    table.uuid('id').primary();
    table.uuid('order_id').notNullable();
    table.foreign('order_id').references('orders.id').onDelete('CASCADE');
    table.string('sender_type').notNullable();
    table.text('text').notNullable();
    table.boolean('seen').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('messages');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('shifts');
  await knex.schema.dropTableIfExists('couriers');
}
