import amqp from "amqplib/callback_api.js"
import "dotenv/config"

const worker = async () => {
	amqp.connect(process.env.MQ_URI, function (error0, connection) {
		if (error0) {
			throw error0
		}
		connection.createChannel(function (error1, channel) {
			if (error1) {
				throw error1
			} else {
				console.log("Workers in line to complete jobs.")
				channel.consume(
					"skeleton",
					async msg => {
						skeletonWorker(msg)
					},
					{
						noAck: true,
					}
				)
			}
		})
	})
}

const skeletonWorker = async msg => {
	let data = JSON.parse(msg.content)
	console.log("Received")
}

export { worker }
