// import { success, error, validation } from "../../configs/response.js"
import { hashPassword } from "../../services/auth.js"
import { success, error, validation } from "../../configs/response.js"
import { createUser, findUserByEmail } from "../../models/user.js"
import { createFirebaseUser } from "../../db/firebase.js"

const register = async (req, res) => {
	const { email, password, name, mobile } = req.body
	if (!email || !password)
		return res
			.status(422)
			.json(
				validation([{ field: "email/password", message: "Required" }])
			)

	const exists = await findUserByEmail(email)
	if (exists) return res.status(409).json(error("User exists", null, 409))

	// First create the user in Firebase Authentication so the user exists there as well
	let firebaseUid
	try {
		const firebaseUser = await createFirebaseUser({
			email,
			password,
			displayName: name,
			phoneNumber: mobile || undefined,
		})
		firebaseUid = firebaseUser.uid
	} catch (e) {
		// map firebase errors to friendly responses
		if (e.code === "auth/email-already-exists") {
			return res
				.status(409)
				.json(error("User exists in Firebase", null, 409))
		}
		console.error("Firebase createUser error:", e)
		return res
			.status(500)
			.json(error("Unable to create Firebase user", null, 500))
	}

	const hashed = await hashPassword(password)
	const user = {
		email,
		password: hashed,
		name,
		mobile: mobile || null,
		role: "user",
		organizations: [],
	}
	await createUser(user, firebaseUid)
	res.status(201).json(success("User created", { email }, 201))
}

const login = async (req, res) => {
	const { email, password } = req.body
	if (!email || !password)
		return res
			.status(422)
			.json(
				validation([{ field: "email/password", message: "Required" }])
			)

	// Authenticate via Firebase Authentication REST API to obtain an ID token
	try {
		const apiKey = process.env.FIREBASE_API_KEY
		if (!apiKey)
			return res
				.status(500)
				.json(error("FIREBASE_API_KEY not configured", null, 500))

		const response = await fetch(
			`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					password,
					returnSecureToken: true,
				}),
			}
		)
		const data = await response.json()
		if (!response.ok) {
			return res.status(401).json(error("Invalid credentials", null, 401))
		}

		// data.idToken is the Firebase ID token the client should use for authenticated requests
		return res
			.status(200)
			.json(success("Login successful", { token: data.idToken }, 200))
	} catch (e) {
		console.error("Login error:", e)
		return res.status(500).json(error("Login failed", null, 500))
	}
}

export { register, login }
import { successLogger, errorLogger } from "../../services/logger.js"

const check = (req, res) => {
	successLogger.info({
		message: "Data added successfully",
		statusCode: res.statusCode,
		responseTime: res.getHeaders()["x-response-time"],
		requestedUrl: req.url,
		method: req.method,
		requestBody: req.body,
	})
	res.status(200).json(
		success("Sending success", { data: "Works" }, res.statusCode)
	)
}

export { check }
