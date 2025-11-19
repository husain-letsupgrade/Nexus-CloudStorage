import { success, error, validation } from "../../configs/response.js"
import { getDb } from "../../db/mongo.js"
import { ObjectId } from "mongodb"

const list = async (req, res) => {
	const user = req.user
	if (!user) return res.status(401).json(error("Unauthorized", null, 401))

	let userObjectId
	try {
		userObjectId = new ObjectId(user.id) // why is this being used.. they are better ways to do this. do not do it this way
	} catch {
		return res
			.status(422)
			.json(validation([{ field: "userId", message: "Invalid user id" }]))
	}
	// why initialise db here
	const db = getDb()
	const orgs = await db
		.collection("organizations")
		.find({ members: userObjectId })
		.toArray()

	res.status(200).json(success("Orgs listed", { orgs }, 200))
}

export { list }
