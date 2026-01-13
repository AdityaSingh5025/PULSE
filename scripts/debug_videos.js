
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pulse";

const videoSchema = new mongoose.Schema({
    title: String,
    userId: String,
    userName: String,
    createdAt: Date
});

const Video = mongoose.models.Video || mongoose.model("Video", videoSchema);

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to DB");

    const videos = await Video.find({}).lean();
    console.log("Total Videos:", videos.length);
    videos.forEach(v => {
        console.log(`ID: ${v._id} | userId: '${v.userId}' | userName: '${v.userName}' | Title: ${v.title}`);
    });

    await mongoose.disconnect();
}

run().catch(console.error);
