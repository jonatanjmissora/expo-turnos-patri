import type { VercelRequest, VercelResponse } from "@vercel/node"
import { loginHandler } from "../../lib/handlers/login.js"
import { logoutHandler } from "../../lib/handlers/logout.js"
import { meHandler } from "../../lib/handlers/me.js"
import { registerHandler } from "../../lib/handlers/register.js"

/**
 * Catch-all del dominio auth. Consolida los endpoints de autenticación en una
 * sola Serverless Function (límite del plan Hobby).
 *
 * Rutas internas: login · register · logout · me.
 * Las URL públicas se mantienen mapeadas en `vercel.json`.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
	const raw = req.query.action
	const action = (Array.isArray(raw) ? raw : raw ? [raw] : []).join("/")

	switch (action) {
		case "login":
			return loginHandler(req, res)
		case "register":
			return registerHandler(req, res)
		case "logout":
			return logoutHandler(req, res)
		case "me":
			return meHandler(req, res)
		default:
			res.status(404).json({ error: "not_found" })
	}
}
