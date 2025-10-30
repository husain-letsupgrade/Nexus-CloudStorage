import "dotenv/config"
import { SQSClient, AddPermissionCommand } from "@aws-sdk/client-sqs"
const client = new SQSClient({ region: process.env.AWS_REGION })
