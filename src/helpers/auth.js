import { hashPassword } from "../services/auth.js"
import { success, error, validation } from "../configs/response.js"
import { createUser, findUserByEmail } from "../models/user.js"
import { createFirebaseUser } from "../db/firebase.js"

// Helper function for user registration
const registerHelper = async (email, password, name, mobile) => {
	return new Promise(async (resolve, reject) => {
		if (!email || !password) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Email and password are required",
			})
		}

		try {
			const exists = await findUserByEmail(email)
			if (exists) {
				return reject({
					code: 409,
					success: false,
					error: true,
					message: "User already exists",
				})
			}

			// First create the user in Firebase Authentication
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
					return reject({
						code: 409,
						success: false,
						error: true,
						message: "User already exists in Firebase",
					})
				}
				console.error("Firebase createUser error:", e)
				return reject({
					code: 500,
					success: false,
					error: true,
					message: "Unable to create Firebase user",
				})
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

			let response = {
				success: true,
				error: false,
				data: { email },
			}
			resolve(response)
		} catch (err) {
			let response = {
				success: false,
				error: true,
				message: err?.message || "Internal Server Error",
			}
			reject(response)
		}
	})
}

// Helper function for user login
const loginHelper = async (email, password) => {
	if (!email || !password) {
		throw {
			code: 422,
			message: "Email and password are required",
		}
	}

	const apiKey = process.env.FIREBASE_API_KEY
	if (!apiKey) {
		throw {
			code: 500,
			message: "FIREBASE_API_KEY not configured",
		}
	}

	const response = await fetch(
		`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password, returnSecureToken: true }),
		}
	)

	const data = await response.json()

	if (!response.ok) {
		throw {
			code: 401,
			message: "Invalid credentials",
		}
	}

	return {
		success: true,
		data: {
			token: data.idToken,
		},
	}
}

const checkHelper = (req, res) => {
	successLogger.info({
		message: "Data added successfully",
		statusCode: res.statusCode,
		responseTime: res.getHeaders()["x-response-time"],
		requestedUrl: req.url,
		method: req.method,
		requestBody: req.body,
	})

	return success("Sending success", { data: "Works" }, 200)
}

export { registerHelper, loginHelper, checkHelper }
