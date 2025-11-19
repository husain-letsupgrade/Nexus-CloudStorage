import { getDb } from "../db/mongo.js"
import { success, error, validation } from "../configs/response.js"
import { ObjectId } from "mongodb"

// Helper function to create organization
const createOrgHelper = async (name, description, logo) => {
	return new Promise(async (resolve, reject) => {

		//redo
		if (!name) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Organization name is required",
			})
		}

		const db = getDb()

		// check duplicate name
		const existing = await db.collection("organizations").findOne({ name })
		if (existing) {
			return reject({
				code: 409,
				success: false,
				error: true,
				message: "Organization with this name already exists",
			})
		}

		// Default logo to assets/group.png if not provided
		const orgLogo = logo || "/assets/group.png"

		try {
			const result = await db.collection("organizations").insertOne({
				name,
				description,
				logo: orgLogo,
				members: [],
				createdAt: new Date(),
			})
			let response = {
				success: true,
				error: false,
				data: { id: result.insertedId },
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

// Helper function to search files in organization
const searchFilesInOrgHelper = async (orgId, q) => {
	return new Promise(async (resolve, reject) => {

		//redo
		let orgObjectId
		try {
			orgObjectId = new ObjectId(orgId)
		} catch (e) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Invalid orgId",
			})
		}

		const db = getDb()
		const query = { organizationId: orgObjectId }

		if (q) {
			query.$or = [
				{ name: { $regex: q, $options: "i" } },
				{ description: { $regex: q, $options: "i" } },
				{ tags: { $in: [new RegExp(q, "i")] } },
			]
		}

		try {
			const files = await db.collection("files").find(query).toArray()
			let response = {
				success: true,
				error: false,
				data: { files },
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

// Helper function to get organization by ID
const getOrgByIdHelper = async orgId => {
	return new Promise(async (resolve, reject) => {

		//redo
		let orgObjectId
		try {
			orgObjectId = new ObjectId(orgId)
		} catch (e) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Invalid orgId",
			})
		}

		try {
			const db = getDb()
			const org = await db
				.collection("organizations")
				.findOne({ _id: orgObjectId })

			if (!org) {
				return reject({
					code: 404,
					success: false,
					error: true,
					message: "Organization not found",
				})
			}

			let response = {
				success: true,
				error: false,
				data: { org },
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

// Helper function to update organization

//rewirte this api in a better way, dont use a try catch block, use a promise instead
const updateOrgHelper = async (orgId, name, description, logo) => {
	//redo
	return new Promise(async (resolve, reject) => {
		//redo
		let orgObjectId
		try {
			orgObjectId = new ObjectId(orgId)
		} catch (e) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Invalid orgId",
			})
		}

		try {
			const db = getDb() // why initialise db here

			if (name) {
				const existing = await db.collection("organizations").findOne({
					name,
					_id: { $ne: orgObjectId },
				})
				if (existing) {
					return reject({
						code: 409,
						success: false,
						error: true,
						message: "Organization with this name already exists",
					})
				}
			}

			const update = {}
			if (name) update.name = name
			if (description) update.description = description
			if (logo !== undefined) update.logo = logo || "/assets/group.png"

			if (Object.keys(update).length === 0) {
				return reject({
					code: 400,
					success: false,
					error: true,
					message: "Nothing to update",
				})
			}

			await db
				.collection("organizations")
				.updateOne({ _id: orgObjectId }, { $set: update })

			const org = await db
				.collection("organizations")
				.findOne({ _id: orgObjectId })

			let response = {
				success: true,
				error: false,
				data: { org },
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

// Helper function to delete organization
const deleteOrgHelper = async orgId => {
	return new Promise(async (resolve, reject) => {

		//redo
		let orgObjectId
		try {
			orgObjectId = new ObjectId(orgId)
		} catch (e) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Invalid orgId",
			})
		}

		try {
			const db = getDb() // why initialise db here
			await db.collection("organizations").deleteOne({ _id: orgObjectId })

			let response = {
				success: true,
				error: false,
				message: "Organization deleted",
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

// Helper function to get user by ID
const getUserByIdHelper = async userId => {
	return new Promise(async (resolve, reject) => {

		//redo
		let userObjectId
		try {
			userObjectId = new ObjectId(userId)
		} catch (e) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Invalid userId",
			})
		}

		try {
			const db = getDb() // why initialise db here
			const user = await db
				.collection("users")
				.findOne({ _id: userObjectId }, { projection: { password: 0 } })

			if (!user) {
				return reject({
					code: 404,
					success: false,
					error: true,
					message: "User not found",
				})
			}

			let response = {
				success: true,
				error: false,
				data: { user },
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

// Helper function to update user
const updateUserHelper = async (userId, name, role) => {
	return new Promise(async (resolve, reject) => {

		//redo
		let userObjectId
		try {
			userObjectId = new ObjectId(userId)
		} catch (e) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Invalid userId",
			})
		}

		try {
			const update = {}
			if (name) update.name = name
			if (role) update.role = role

			if (Object.keys(update).length === 0) {
				return reject({
					code: 400,
					success: false,
					error: true,
					message: "Nothing to update",
				})
			}

			const db = getDb() // why initialise db here
			await db
				.collection("users")
				.updateOne({ _id: userObjectId }, { $set: update })

			const user = await db
				.collection("users")
				.findOne({ _id: userObjectId }, { projection: { password: 0 } })

			let response = {
				success: true,
				error: false,
				data: { user },
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

// Helper function to delete (disable) user - sets active: false and disabled: true
const deleteUserHelper = async userId => {
	return new Promise(async (resolve, reject) => {

		//redo
		let userObjectId
		try {
			userObjectId = new ObjectId(userId)
		} catch (e) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Invalid userId",
			})
		}

		try {
			const db = getDb() // why initialise db here
			await db
				.collection("users")
				.updateOne(
					{ _id: userObjectId },
					{ $set: { active: false, disabled: true } }
				)

			let response = {
				success: true,
				error: false,
				message: "User disabled",
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

// Helper function to add user to organization
const addUserToOrgHelper = async (orgId, userId) => {
	return new Promise(async (resolve, reject) => {

		//redo
		if (!orgId || !userId) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "orgId and userId are required",
			})
		}

		let orgObjectId, userObjectId
		try {
			orgObjectId = new ObjectId(orgId)
			userObjectId = new ObjectId(userId)
		} catch (e) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Invalid orgId or userId format",
			})
		}

		try {
			const db = getDb()

			await db
				.collection("organizations")
				.updateOne(
					{ _id: orgObjectId },
					{ $addToSet: { members: userObjectId } }
				)

			await db
				.collection("users")
				.updateOne(
					{ _id: userObjectId },
					{ $addToSet: { organizations: orgObjectId } }
				)

			const updatedOrg = await db
				.collection("organizations")
				.findOne({ _id: orgObjectId })
			const updatedUser = await db
				.collection("users")
				.findOne({ _id: userObjectId }, { projection: { password: 0 } })

			let response = {
				success: true,
				error: false,
				data: { org: updatedOrg, user: updatedUser },
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

// Helper function to remove user from organization
const removeUserFromOrgHelper = async (orgId, userId) => {
	return new Promise(async (resolve, reject) => {
		if (!orgId || !userId) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "orgId and userId are required",
			})
		}

		let orgObjectId, userObjectId
		try {
			orgObjectId = new ObjectId(orgId)
			userObjectId = new ObjectId(userId)
		} catch (e) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Invalid orgId or userId format",
			})
		}

		try {
			const db = getDb()

			await db
				.collection("organizations")
				.updateOne(
					{ _id: orgObjectId },
					{ $pull: { members: userObjectId } }
				)

			await db
				.collection("users")
				.updateOne(
					{ _id: userObjectId },
					{ $pull: { organizations: orgObjectId } }
				)

			const updatedOrg = await db
				.collection("organizations")
				.findOne({ _id: orgObjectId })
			const updatedUser = await db
				.collection("users")
				.findOne({ _id: userObjectId }, { projection: { password: 0 } })

			let response = {
				success: true,
				error: false,
				data: { org: updatedOrg, user: updatedUser },
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

// Helper function to search users in organization
const searchUsersInOrgHelper = async (orgId, q) => {
	return new Promise(async (resolve, reject) => {
		if (!orgId) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "orgId is required",
			})
		}

		let orgObjectId
		try {
			orgObjectId = new ObjectId(orgId)
		} catch (e) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Invalid orgId",
			})
		}

		try {
			const db = getDb()
			const filter = { organizations: orgObjectId }

			if (q) {
				filter.$or = [
					{ name: { $regex: q, $options: "i" } },
					{ email: { $regex: q, $options: "i" } },
				]
			}

			const users = await db
				.collection("users")
				.find(filter)
				.project({ password: 0 })
				.toArray()

			let response = {
				success: true,
				error: false,
				data: { users },
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

// Helper function to get users in organization
const getUsersInOrgHelper = async orgId => {
	return new Promise(async (resolve, reject) => {
		let orgObjectId

		try {
			orgObjectId = new ObjectId(orgId)
		} catch (e) {
			return reject({
				code: 422,
				success: false,
				error: true,
				message: "Invalid orgId",
			})
		}

		try {
			const db = getDb()
			const users = await db
				.collection("users")
				.find({ organizations: orgObjectId })
				.project({ password: 0 })
				.toArray()

			let response = {
				success: true,
				error: false,
				data: { users },
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

export {
	createOrgHelper,
	searchFilesInOrgHelper,
	getOrgByIdHelper,
	updateOrgHelper,
	deleteOrgHelper,
	getUserByIdHelper,
	updateUserHelper,
	deleteUserHelper,
	addUserToOrgHelper,
	removeUserFromOrgHelper,
	searchUsersInOrgHelper,
	getUsersInOrgHelper,
}
