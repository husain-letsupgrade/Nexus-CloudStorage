import { verifyJwt } from "../services/auth.js"

const authenticate = (req, res, next) => {
	const authHeader = req.headers.authorization || req.headers.Authorization
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res
			.status(401)
			.json({ message: "Unauthorized", error: true, code: 401 })
	}

	const token = authHeader.split(" ")[1]
	try {
		const payload = verifyJwt(token)
		req.user = payload
		next()
	} catch (err) {
		return res
			.status(401)
			.json({ message: "Invalid token", error: true, code: 401 })
	}
}

export { authenticate }
