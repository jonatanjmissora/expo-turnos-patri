import type { VercelRequest, VercelResponse } from "@vercel/node"
import { loginHandler } from "../../lib/handlers/login.js"

export default function handler(req: VercelRequest, res: VercelResponse) {
	return loginHandler(req, res)
}
