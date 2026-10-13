import type { VercelRequest, VercelResponse } from "@vercel/node"
import { registerHandler } from "../../lib/handlers/register.js"

export default function handler(req: VercelRequest, res: VercelResponse) {
	return registerHandler(req, res)
}
