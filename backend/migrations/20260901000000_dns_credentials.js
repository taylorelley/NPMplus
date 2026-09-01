import { migrate as logger } from "../logger.js";

const migrateName = "dns_credentials";

/**
 * Migrate
 *
 * @see https://knexjs.org/guide/migrations.html#migration-api
 *
 * @param   {Object} knex
 * @returns {Promise}
 */
const up = async (knex) => {
	logger.info(`[${migrateName}] Migrating Up...`);

	await knex.schema.createTable("npmplus_dns_credentials", (table) => {
		table.increments().primary();
		table.dateTime("created_on").notNullable();
		table.dateTime("modified_on").notNullable();
		table.integer("owner_user_id").unsigned().notNullable();
		table.string("name").notNullable();
		table.string("provider_id").notNullable();
		table.text("credentials").notNullable();
		table.integer("is_deleted").unsigned().notNullable().defaultTo(0);
	});

	logger.info(`[${migrateName}] npmplus_dns_credentials Table created`);
};

/**
 * Undo Migrate
 *
 * @param   {Object} _knex
 * @returns {Promise}
 */
const down = (_knex) => {
	throw new Error(`[${migrateName}] You can't migrate down this one.`);
};

export { down, up };
