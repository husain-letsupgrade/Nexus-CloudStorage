import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import "dotenv/config"

const hashPassword = async password => {
	const salt = await bcrypt.genSalt(10)
	return bcrypt.hash(password, salt)
}

const comparePassword = async (password, hash) => {
	return bcrypt.compare(password, hash)
}

const signJwt = payload => {
	return jwt.sign(payload, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES || "7d",
	})
}

const verifyJwt = token => {
	return jwt.verify(token, process.env.JWT_SECRET)
}

export { hashPassword, comparePassword, signJwt, verifyJwt }
