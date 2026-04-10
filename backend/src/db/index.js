import mongoose from "mongoose"

const URI = process.env.MONGO_URI

const connectDB = async()=>{
    try {
        console.log("My MongoDB URI is: ", process.env.MONGO_URI);
        const connectionIns = await mongoose.connect(`${URI}`)

       console.log(`\n MongoDB connected! DB host: ${connectionIns.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection failed",error)
        process.exit(1);
    }
}

export default connectDB