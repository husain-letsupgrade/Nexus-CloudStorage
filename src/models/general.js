/**
 * general
 * @desc A global function used to get an object with basic timestamps and creator details.
 * @param   {string} uid of the user creating the entity.
 *
 *
 * @returns An object containing basic paramters every document must have.
 */
const general = async uid => {
	let data = {
		createdAt: new Date(),
		updatedAt: new Date(),
		createdBy: uid,
		updatedBy: uid,
	}
	return data
}

/**
 * timestamp
 * @desc A global function used to get an object with basic timestamps .
 * @param   {string} uid of the user creating the entity.
 *
 *
 * @returns An object containing basic paramters every document must have of time.
 */

const timestamp = async () => {
	let data = {
		createdAt: new Date(),
		updatedAt: new Date(),
	}
	return data
}

const updateTimestamp = async uid => {
	let data = {
		updatedBy: uid,
		updatedAt: new Date(),
	}
	return data
}

export { general, timestamp, updateTimestamp }
