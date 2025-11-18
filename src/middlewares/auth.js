import { auth } from "../db/firebase.js"
import { usercoll } from "../db/mongo.js"

const authenticate = async (req, res, next) => {
	const authHeader = req.headers.authorization || req.headers.Authorization

	if (!authHeader?.startsWith("Bearer ")) {
		return res.status(401).json({
			message: "Unauthorized",
			error: true,
			code: 401,
		})
	}

	const token = authHeader.split(" ")[1]

	try {
		// Verify Firebase token
		const decoded = await auth.verifyIdToken(token)

		// Fetch user from MongoDB by Firebase UID
		const users = await usercoll()
		const userDoc = await users.findOne({ firebaseUid: decoded.uid })

		if (!userDoc) {
			return res.status(401).json({
				message: "Unauthorized - user not found",
				error: true,
				code: 401,
			})
		}

		// Attach user info to request
		req.user = {
			uid: decoded.uid,
			id: userDoc._id.toString(),
			role: userDoc.role,
			email: userDoc.email,
		}

		next()
	} catch (err) {
		return res.status(401).json({
			message: "Invalid token",
			error: true,
			code: 401,
		})
	}
}

export { authenticate }
