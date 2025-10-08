

import { success, error, validation } from '../../configs/response.js'
import { successLogger, errorLogger } from '../../services/logger.js'

const check = (req, res) => {
    successLogger.info({
        message: "Data added successfully",
        statusCode: res.statusCode,
        responseTime: res.getHeaders()['x-response-time'], requestedUrl: req.url,
        method: req.method,
        requestBody: req.body
    })
    res.status(200).json(success("Sending success", { data: "Works" }, res.statusCode))
}

export {
    check
}