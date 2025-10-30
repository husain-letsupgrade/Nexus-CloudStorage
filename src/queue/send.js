// var amqp = require('amqplib/callback_api');
import amqp from "amqplib/callback_api.js"
import "dotenv/config"

let _channel

const rabbitConnect = () => {
	amqp.connect(process.env.MQ_URI, function (error0, connection) {
		if (error0) {
			throw error0
		}
		connection.createChannel(function (error1, channel) {
			console.log("Queues ready to accept commands.")
			if (error1) {
				throw error1
			} else {
				channel.assertQueue("skeleton", { durable: true })
			}
		})
	})
}

const watiQueue = data => {
	_channel.sendToQueue("register", Buffer.from(data))
}

export { rabbitConnect, watiQueue }
