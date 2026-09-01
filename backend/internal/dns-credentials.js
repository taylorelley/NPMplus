import errs from "../lib/error.js";
import utils from "../lib/utils.js";
import dnsCredentialsModel from "../models/dns_credentials.js";
import internalAuditLog from "./audit-log.js";

const omissions = () => ["is_deleted", "owner.is_deleted"];

/**
 * Audit log meta never contains the credentials themselves, they are secrets.
 *
 * @param   {Object}  row
 * @returns {Object}
 */
const auditMeta = (row) => ({
	name: row.name,
	provider_id: row.provider_id,
});

const internalDnsCredentials = {
	/**
	 * @param   {Access}  access
	 * @param   {Object}  data
	 * @param   {String}  data.name
	 * @param   {String}  data.provider_id
	 * @param   {String}  data.credentials
	 * @returns {Promise}
	 */
	create: async (access, data) => {
		await access.can("settings:create", data);

		const row = utils.omitRow(omissions())(
			await dnsCredentialsModel.query().insertAndFetch({
				name: data.name,
				provider_id: data.provider_id,
				credentials: data.credentials,
				owner_user_id: access.token.getUserId(1),
			}),
		);

		await internalAuditLog.add(access, {
			action: "created",
			object_type: "dns-credential",
			object_id: row.id,
			meta: auditMeta(row),
		});

		return row;
	},

	/**
	 * @param  {Access}  access
	 * @param  {Object}  data
	 * @param  {Number}  data.id
	 * @return {Promise}
	 */
	get: async (access, data) => {
		const thisData = data || {};
		const accessData = await access.can("settings:get", thisData.id);

		const query = dnsCredentialsModel.query().where("is_deleted", 0).andWhere("id", thisData.id).first();

		if (accessData.permission_visibility !== "all") {
			query.andWhere("owner_user_id", access.token.getUserId(1));
		}

		const row = utils.omitRow(omissions())(await query);
		if (!row?.id) {
			throw new errs.ItemNotFoundError(thisData.id);
		}
		return row;
	},

	/**
	 * @param  {Access}  access
	 * @param  {Object}  data
	 * @param  {Number}  data.id
	 * @return {Promise}
	 */
	update: async (access, data) => {
		await access.can("settings:update", data.id);

		const existingRow = await internalDnsCredentials.get(access, { id: data.id });
		if (existingRow.id !== data.id) {
			// Sanity check that something crazy hasn't happened
			throw new errs.InternalValidationError(
				`DNS Credentials could not be updated, IDs do not match: ${existingRow.id} !== ${data.id}`,
			);
		}

		// The api allows partial updates, only patch what was sent
		const patch = {};
		for (const field of ["name", "provider_id", "credentials"]) {
			if (typeof data[field] !== "undefined") {
				patch[field] = data[field];
			}
		}
		await dnsCredentialsModel.query().where({ id: data.id }).patch(patch);

		const row = await internalDnsCredentials.get(access, { id: data.id });

		await internalAuditLog.add(access, {
			action: "updated",
			object_type: "dns-credential",
			object_id: row.id,
			meta: auditMeta(row),
		});

		return row;
	},

	/**
	 * @param {Access}  access
	 * @param {Object}  data
	 * @param {Number}  data.id
	 * @returns {Promise}
	 */
	delete: async (access, data) => {
		await access.can("settings:delete", data.id);

		const row = await internalDnsCredentials.get(access, { id: data.id });

		await dnsCredentialsModel.query().where("id", row.id).patch({ is_deleted: 1 });

		await internalAuditLog.add(access, {
			action: "deleted",
			object_type: "dns-credential",
			object_id: row.id,
			meta: auditMeta(row),
		});

		return true;
	},

	/**
	 * All DNS Credentials
	 *
	 * @param   {Access}  access
	 * @returns {Promise}
	 */
	getAll: async (access) => {
		const accessData = await access.can("settings:list");

		const query = dnsCredentialsModel.query().where("is_deleted", 0).orderBy("name", "ASC");

		if (accessData.permission_visibility !== "all") {
			query.andWhere("owner_user_id", access.token.getUserId(1));
		}

		return utils.omitRows(omissions())(await query);
	},
};

export default internalDnsCredentials;
