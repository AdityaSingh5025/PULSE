import mongoose from "mongoose";
import { buffer } from "stream/consumers";

const MONGO_URL = process.env.MONGO_URL!    

if (!MONGO_URL) {
    throw new Error("Please define the MONGO_URL environment variable inside .env.local");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }  
    if (!cached.promise) {
        const opts = {
            bufferCommands: true,
            maxpoolsize: 10,
        }
        mongoose
        .connect(MONGO_URL, opts)
        .then(()=> mongoose.connect)
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }
}