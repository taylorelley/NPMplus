import express from "express";
import internalDnsCredentials from "../../internal/dns-credentials.js";
import jwtdecode from "../../lib/express/jwt-decode.js";
import apiValidator from "../../lib/validator/api.js";
import validator from "../../lib/validator/index.js";
import { debug, express as logger } from "../../logger.js";
import { getValidationSchema } from "../../schema/index.js";

const router = express.Router({
	caseSensitive: true,
	strict: true,
	mergeParams: true,
});

/**
 * /api/nginx/dns-credentials
 */
router
	.route("/")
	.options((_, res) => {
		res.sendStatus(204);
	})
	.all(jwtdecode())

	/**
	 * GET /api/nginx/dns-credentials
	 *
	 * Retrieve all dns-credentials
	 */
	.get(async (req, res, next) => {
		try {
			const rows = await internalDnsCredentials.getAll(res.locals.access);
			res.status(200).send(rows);
		} catch (err) {
			debug(logger, `${req.method.toUpperCase()} ${req.originalUrl}: ${err}`);
			next(err);
		}
	})

	/**
	 * POST /api/nginx/dns-credentials
	 *
	 * Create new dns-credentials
	 */
	.post(async (req, res, next) => {
		try {
			const payload = apiValidator(getValidationSchema("/nginx/dns-credentials", "post"), req.body);
			const result = await internalDnsCredentials.create(res.locals.access, payload);
			res.status(201).send(result);
		} catch (err) {
			debug(logger, `${req.method.toUpperCase()} ${req.originalUrl}: ${err}`);
			next(err);
		}
	});

/**
 * Specific dns-credentials
 *
 * /api/nginx/dns-credentials/123
 */
router
	.route("/:credential_id")
	.options((_, res) => {
		res.sendStatus(204);
	})
	.all(jwtdecode())

	/**
	 * GET /api/nginx/dns-credentials/123
	 *
	 * Retrieve specific dns-credentials
	 */
	.get(async (req, res, next) => {
		try {
			const data = await validator(
				{
					required: ["credential_id"],
					additionalProperties: false,
					properties: {
						credential_id: {
							$ref: "common#/properties/id",
						},
					},
				},
				{
					credential_id: req.params.credential_id,
				},
			);
			const row = await internalDnsCredentials.get(res.locals.access, {
				id: Number.parseInt(data.credential_id, 10),
			});
			res.status(200).send(row);
		} catch (err) {
			debug(logger, `${req.method.toUpperCase()} ${req.originalUrl}: ${err}`);
			next(err);
		}
	})

	/**
	 * PUT /api/nginx/dns-credentials/123
	 *
	 * Update existing dns-credentials
	 */
	.put(async (req, res, next) => {
		try {
			const payload = apiValidator(getValidationSchema("/nginx/dns-credentials/{credentialID}", "put"), req.body);
			payload.id = Number.parseInt(req.params.credential_id, 10);
			const result = await internalDnsCredentials.update(res.locals.access, payload);
			res.status(200).send(result);
		} catch (err) {
			debug(logger, `${req.method.toUpperCase()} ${req.originalUrl}: ${err}`);
			next(err);
		}
	})

	/**
	 * DELETE /api/nginx/dns-credentials/123
	 *
	 * Delete existing dns-credentials
	 */
	.delete(async (req, res, next) => {
		try {
			const result = await internalDnsCredentials.delete(res.locals.access, {
				id: Number.parseInt(req.params.credential_id, 10),
			});
			res.status(200).send(result);
		} catch (err) {
			debug(logger, `${req.method.toUpperCase()} ${req.originalUrl}: ${err}`);
			next(err);
		}
	});

export default router;
