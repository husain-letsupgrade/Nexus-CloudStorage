// import { success, error, validation } from "../../configs/response.js"
import { hashPassword, comparePassword, signJwt } from "../../services/auth.js"
import { success, error, validation } from "../../configs/response.js"
import { createUser, findUserByEmail } from "../../models/user.js"

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

	const hashed = await hashPassword(password)
	const user = {
		email,
		password: hashed,
		name,
		mobile: mobile || null,
		role: "user",
		organizations: [],
	}
	await createUser(user)
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

	const user = await findUserByEmail(email)
	if (!user)
		return res.status(401).json(error("Invalid credentials", null, 401))

	const ok = await comparePassword(password, user.password)
	if (!ok)
		return res.status(401).json(error("Invalid credentials", null, 401))

	const token = signJwt({
		id: user._id.toString(),
		email: user.email,
		role: user.role,
	})
	res.status(200).json(success("Login successful", { token }, 200))
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
