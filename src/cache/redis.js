import { createClient } from "redis"
import "dotenv/config"

let _client
const clientConnect = async () => {
	_client = createClient({
		socket: {
			host: process.env.REDIS_HOST_WRITE,
			port: process.env.REDIS_PORT,
		},
	})
	return new Promise(async (resolve, reject) => {
		_client
			.connect()
			.then(async () => {
				console.log("Caching started.")
				resolve()
			})
			.catch(err => {
				console.log("Error starting caching : " + err.message)
				reject()
			})
	})
}

export { clientConnect, _client }
