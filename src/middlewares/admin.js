const requireAdmin = (req, res, next) => {
	const user = req.user
	if (!user || user.role !== "admin") {
		return res
			.status(403)
			.json({ message: "Error", error: true, code: 403 })
	}
	next()
}

export { requireAdmin }
