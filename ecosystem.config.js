module.exports = {
	apps: [
		{
			name: "LetsUpgrade-Service-API",
			script: "./server.js",
			instances: "max",
			exec_mode: "cluster",
		},
	],
}
