import { auth } from "../db/firebase.js"
import { usercoll } from "../db/mongo.js"

const authenticate = async (req, res, next) => {
	const authHeader = req.headers.authorization || req.headers.Authorization
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res
			.status(401)
			.json({ message: "Unauthorized", error: true, code: 401 })
	}

	const token = authHeader.split(" ")[1]
	try {
		// verifyIdToken returns decoded token containing `uid` and other claims
		const decoded = await auth.verifyIdToken(token)

		// attach Mongo user info (lookup by firebaseUid) so controllers get role and id
		const users = await usercoll()
		const userDoc = await users.findOne({ firebaseUid: decoded.uid })
		if (!userDoc) {
			return res
				.status(401)
				.json({
					message: "Unauthorized - user not found",
					error: true,
					code: 401,
				})
		}

		req.user = {
			uid: decoded.uid,
			id: userDoc._id.toString(),
			role: userDoc.role,
			email: userDoc.email,
		}
		next()
	} catch (err) {
		return res
			.status(401)
			.json({ message: "Invalid token", error: true, code: 401 })
	}
}

export { authenticate }
