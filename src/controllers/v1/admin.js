import { getDb } from "../../db/db.js"
import { success, error, validation } from "../../configs/response.js"
import { ObjectId } from "mongodb"

const listOrgsAdmin = async (req, res) => {
	const db = getDb()
	const orgs = await db.collection("organizations").find({}).toArray()
	res.status(200).json(success("All orgs", { orgs }, 200))
}

const createOrgAdmin = async (req, res) => {
	const { name, description, logo } = req.body
	if (!name)
		return res
			.status(422)
			.json(validation([{ field: "name", message: "Required" }]))
	const db = getDb()
	// check duplicate name
	const existing = await db.collection("organizations").findOne({ name })
	if (existing)
		return res
			.status(409)
			.json(
				error("Organization with this name already exists", null, 409)
			)

	// Default logo to assets/group.png if not provided
	const orgLogo = logo || "/assets/group.png"
	const result = await db.collection("organizations").insertOne({
		name,
		description,
		logo: orgLogo,
		members: [],
		createdAt: new Date(),
	})
	res.status(201).json(success("Org created", { id: result.insertedId }, 201))
}

const listUsersAdmin = async (req, res) => {
	const db = getDb()
	const users = await db
		.collection("users")
		.find({})
		.project({ password: 0 })
		.toArray()
	res.status(200).json(success("All users", { users }, 200))
}

const searchUsersInOrg = async (req, res) => {
	const { orgId, q } = req.query
	const db = getDb()
	const filter = { organizations: orgId }
	if (q)
		filter.$or = [
			{ name: { $regex: q, $options: "i" } },
			{ email: { $regex: q, $options: "i" } },
		]
	const users = await db
		.collection("users")
		.find(filter)
		.project({ password: 0 })
		.toArray()
	res.status(200).json(success("Search users", { users }, 200))
}

const searchFilesInOrgAdmin = async (req, res) => {
	const { orgId } = req.params
	const { q } = req.query
	let orgObjectId
	try {
		orgObjectId = new ObjectId(orgId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "orgId", message: "Invalid orgId" }]))
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
	const files = await db.collection("files").find(query).toArray()
	res.status(200).json(success("Files search", { files }, 200))
}

const addUserToOrgAdmin = async (req, res) => {
	const { orgId } = req.params
	const { userId } = req.body
	if (!orgId || !userId)
		return res
			.status(422)
			.json(validation([{ field: "orgId/userId", message: "Required" }]))
	const db = getDb()
	let orgObjectId, userObjectId
	try {
		orgObjectId = new ObjectId(orgId)
		userObjectId = new ObjectId(userId)
	} catch (e) {
		return res
			.status(422)
			.json(
				validation([
					{ field: "orgId/userId", message: "Invalid id format" },
				])
			)
	}

	// update org members and user's organizations atomically using transactions if available; fallback to sequential
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

	res.status(200).json(
		success(
			"User added to org",
			{ org: updatedOrg, user: updatedUser },
			200
		)
	)
}

export {
	listOrgsAdmin,
	listUsersAdmin,
	searchUsersInOrg,
	createOrgAdmin,
	addUserToOrgAdmin,
}

// Admin CRUD for orgs
const getOrgByIdAdmin = async (req, res) => {
	const { orgId } = req.params
	let orgObjectId
	try {
		orgObjectId = new ObjectId(orgId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "orgId", message: "Invalid orgId" }]))
	}
	const db = getDb()
	const org = await db
		.collection("organizations")
		.findOne({ _id: orgObjectId })
	if (!org)
		return res.status(404).json(error("Organization not found", null, 404))
	res.status(200).json(success("Org fetched", { org }, 200))
}

const updateOrgAdmin = async (req, res) => {
	const { orgId } = req.params
	const { name, description } = req.body
	let orgObjectId
	try {
		orgObjectId = new ObjectId(orgId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "orgId", message: "Invalid orgId" }]))
	}
	const db = getDb()
	if (name) {
		const existing = await db
			.collection("organizations")
			.findOne({ name, _id: { $ne: orgObjectId } })
		if (existing)
			return res
				.status(409)
				.json(
					error(
						"Organization with this name already exists",
						null,
						409
					)
				)
	}
	const { logo } = req.body
	const update = {}
	if (name) update.name = name
	if (description) update.description = description
	if (logo !== undefined) update.logo = logo || "/assets/group.png"
	if (Object.keys(update).length === 0)
		return res
			.status(400)
			.json(validation([{ field: "body", message: "Nothing to update" }]))
	await db
		.collection("organizations")
		.updateOne({ _id: orgObjectId }, { $set: update })
	const org = await db
		.collection("organizations")
		.findOne({ _id: orgObjectId })
	res.status(200).json(success("Org updated", { org }, 200))
}

const deleteOrgAdmin = async (req, res) => {
	const { orgId } = req.params
	let orgObjectId
	try {
		orgObjectId = new ObjectId(orgId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "orgId", message: "Invalid orgId" }]))
	}
	const db = getDb()
	await db.collection("organizations").deleteOne({ _id: orgObjectId })
	// optionally cascade delete: folders, files membership updates; we leave as-is for now but could remove related docs
	res.status(200).json(success("Org deleted", null, 200))
}

// Admin CRUD for users
const getUserByIdAdmin = async (req, res) => {
	const { userId } = req.params
	let userObjectId
	try {
		userObjectId = new ObjectId(userId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "userId", message: "Invalid userId" }]))
	}
	const db = getDb()
	const user = await db
		.collection("users")
		.findOne({ _id: userObjectId }, { projection: { password: 0 } })
	if (!user) return res.status(404).json(error("User not found", null, 404))
	res.status(200).json(success("User fetched", { user }, 200))
}

const updateUserAdmin = async (req, res) => {
	const { userId } = req.params
	const { name, role } = req.body
	let userObjectId
	try {
		userObjectId = new ObjectId(userId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "userId", message: "Invalid userId" }]))
	}
	const db = getDb()
	const update = {}
	if (name) update.name = name
	if (role) update.role = role
	if (Object.keys(update).length === 0)
		return res
			.status(400)
			.json(validation([{ field: "body", message: "Nothing to update" }]))
	await db
		.collection("users")
		.updateOne({ _id: userObjectId }, { $set: update })
	const user = await db
		.collection("users")
		.findOne({ _id: userObjectId }, { projection: { password: 0 } })
	res.status(200).json(success("User updated", { user }, 200))
}

const deleteUserAdmin = async (req, res) => {
	const { userId } = req.params
	let userObjectId
	try {
		userObjectId = new ObjectId(userId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "userId", message: "Invalid userId" }]))
	}
	const db = getDb()
	await db.collection("users").deleteOne({ _id: userObjectId })
	res.status(200).json(success("User deleted", null, 200))
}

// Remove user from organization (admin only)
const removeUserFromOrgAdmin = async (req, res) => {
	const { orgId, userId } = req.params
	if (!orgId || !userId)
		return res
			.status(422)
			.json(validation([{ field: "orgId/userId", message: "Required" }]))
	const db = getDb()

	let orgObjectId, userObjectId
	try {
		orgObjectId = new ObjectId(orgId)
		userObjectId = new ObjectId(userId)
	} catch (e) {
		return res
			.status(422)
			.json(
				validation([
					{ field: "orgId/userId", message: "Invalid id format" },
				])
			)
	}

	// verify both exist
	const [org, user] = await Promise.all([
		db.collection("organizations").findOne({ _id: orgObjectId }),
		db.collection("users").findOne({ _id: userObjectId }),
	])
	if (!org)
		return res.status(404).json(error("Organization not found", null, 404))
	if (!user) return res.status(404).json(error("User not found", null, 404))

	// update org members and user's organizations atomically using transactions if available; fallback to sequential
	await db
		.collection("organizations")
		.updateOne({ _id: orgObjectId }, { $pull: { members: userObjectId } })
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

	res.status(200).json(
		success(
			"User removed from org",
			{ org: updatedOrg, user: updatedUser },
			200
		)
	)
}

export {
	getOrgByIdAdmin,
	updateOrgAdmin,
	deleteOrgAdmin,
	getUserByIdAdmin,
	updateUserAdmin,
	deleteUserAdmin,
	searchFilesInOrgAdmin,
	removeUserFromOrgAdmin,
}

// Admin: list users in an organization
const getUsersInOrgAdmin = async (req, res) => {
	const { orgId } = req.params
	const db = getDb()
	let orgObjectId
	try {
		orgObjectId = new ObjectId(orgId)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "orgId", message: "Invalid orgId" }]))
	}
	const users = await db
		.collection("users")
		.find({ organizations: orgObjectId })
		.project({ password: 0 })
		.toArray()
	res.status(200).json(success("Users fetched", { users }, 200))
}

export { getUsersInOrgAdmin }
