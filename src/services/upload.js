import "dotenv/config"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
const REGION = process.env.AWS_REGION
const s3Client = new S3Client({ region: REGION })

const upload = async (bucketName, path, fileName, file) => {
	return new Promise(async (resolve, reject) => {
		try {
			const params = {
				Bucket: bucketName,
				Key: `${path}${fileName}`,
				Body: file,
			}
			const results = await s3Client.send(new PutObjectCommand(params))
			resolve(results)
		} catch (err) {
			reject(err)
		}
	})
}

export { upload }
