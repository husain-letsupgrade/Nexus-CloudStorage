import { success, error } from "../../configs/response.js"
import { registerHelper, loginHelper, checkHelper } from "../../helpers/auth.js"

// Register
const register = async (req, res) => {
	const { email, password, name, mobile } = req.body


	
	try {
		const result = await registerHelper(email, password, name, mobile)
		return res.status(201).json(success("User created", result.data, 201))
	} catch (err) {
		return res
			.status(err?.code || 500)
			.json(
				error(
					"Error registering user",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
	}
}

// Login
const login = async (req, res) => {
	const { email, password } = req.body

	try {
		const result = await loginHelper(email, password)
		return res
			.status(200)
			.json(success("Login successful", result.data, 200))
	} catch (err) {
		return res
			.status(err?.code || 500)
			.json(
				error(
					"Error logging in",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
	}
}

// Check auth
const check = async (req, res) => {
	try {
		const result = await checkHelper(req, res)
		return res.status(200).json(success("Check successful", result, 200))
	} catch (err) {
		return res
			.status(err?.code || 500)
			.json(
				error(
					"Error checking auth",
					{ message: err?.message || "Internal Server Error" },
					err?.code || 500
				)
			)
	}
}

export { register, login, check }
