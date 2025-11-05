import { success, error, validation } from "../../configs/response.js"
import { createOrg, listOrgs, findOrgById } from "../../models/organization.js"
import { getDb } from "../../db/mongo.js"
import { ObjectId } from "mongodb"

const create = async (req, res) => {
	const { name, description } = req.body
	if (!name)
		return res
			.status(422)
			.json(validation([{ field: "name", message: "Required" }]))
	const db = getDb()
	const existing = await db.collection("organizations").findOne({ name })
	if (existing)
		return res
			.status(409)
			.json(
				error("Organization with this name already exists", null, 409)
			)
	const org = { name, description, createdAt: new Date(), members: [] }
	const results = await createOrg(org)
	res.status(201).json(
		success("Organization created", { id: results.insertedId }, 201)
	)
}

const list = async (req, res) => {
	const db = getDb()
	const user = req.user
	if (!user) return res.status(401).json(error("Unauthorized", null, 401))
	// return the orgs the user belongs to (members stored as ObjectId)
	let userObjectId
	try {
		userObjectId = new ObjectId(user.id)
	} catch (e) {
		return res
			.status(422)
			.json(validation([{ field: "userId", message: "Invalid user id" }]))
	}
	const orgs = await db
		.collection("organizations")
		.find({ members: userObjectId })
		.toArray()
	res.status(200).json(success("Orgs listed", { orgs }, 200))
}

export { create, list }
