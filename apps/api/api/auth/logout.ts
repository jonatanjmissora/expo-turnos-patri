import type { VercelRequest, VercelResponse } from "@vercel/node"
import { logoutHandler } from "../../lib/handlers/logout.js"

export default function handler(req: VercelRequest, res: VercelResponse) {
	return logoutHandler(req, res)
}
