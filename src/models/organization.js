import { orgcoll } from "../db/mongo.js"
import { general, timestamp } from "./general.js"

const orgCollection = async () => await orgcoll()

const createOrg = async (org, uid) => {
	const meta = uid ? await general(uid) : await timestamp()
	// ensure fileCount exists and members is an array
	const doc = {
		...org,
		fileCount: typeof org.fileCount === "number" ? org.fileCount : 0,
		members: Array.isArray(org.members)
			? org.members
			: org.members
			? [org.members]
			: [],
		...meta,
	}
	return (await orgCollection()).insertOne(doc)
}

const listOrgs = async () => (await orgCollection()).find({}).toArray()

const findOrgById = async id => (await orgCollection()).findOne({ _id: id })

export { createOrg, listOrgs, findOrgById }
