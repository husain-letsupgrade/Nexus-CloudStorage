import { MongoClient } from "mongodb";
import 'dotenv/config';


let _db
const mongoConnect = async () => {
    new Promise(async (resolve, reject) => {

        MongoClient.connect(process.env.COMMUNITY_URI, { useUnifiedTopology: true })
        .then(async client => {
            _db = await client.db()
            resolve()
        }).catch(err=>{
            reject(err)
        })
    }).then(async ()=>{
        console.log("Databse plugged in and healthy to serve.!")
    }).catch(err=>{
        console.log("Error connecting to database")
        console.log(err)
    })
}


export {
    mongoConnect,
}