import { createTransport } from "nodemailer"
import { readFile } from "fs"
require("dotenv").config()

const EMAIL_USER = process.env.SES_USER
const EMAIL_PASS = process.env.SES_PASSWORD

/** smtp configuration for nodemailer */
var transporter = createTransport({
	host: process.env.SES_SMTP_HOST,
	port: 587,
	secure: false,
	auth: {
		user: EMAIL_USER,
		pass: EMAIL_PASS,
	},
})

const readHTMLTemplate = async templatePath => {
	return new Promise((resolve, reject) => {
		readFile(templatePath, { encoding: "utf-8" }, function (err, html) {
			if (err) {
				reject(err)
			} else {
				resolve(html)
			}
		})
	})
}
const sendMail = async mailOptions => {
	try {
		let info = await transporter.sendMail(mailOptions)
		return true
	} catch (e) {
		return false
	}
}
const sendMailCert = async mailOptions => {
	try {
		let info = await transporter.sendMail(mailOptions)
		info.status = true
		return info
	} catch (e) {
		let resp = {
			status: false,
			error: e.message,
		}
		return resp
	}
}

export { readHTMLTemplate, sendMailCert, sendMail }
