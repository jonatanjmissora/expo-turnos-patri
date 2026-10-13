import type { VercelRequest, VercelResponse } from "@vercel/node"
import { meHandler } from "../../lib/handlers/me.js"

export default function handler(req: VercelRequest, res: VercelResponse) {
	return meHandler(req, res)
}
