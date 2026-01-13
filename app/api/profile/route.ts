import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/db";
import Video from "@/model/Vdeo";
import User from "@/model/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch user with follower info
    const user = await User.findOne({ email: session.user.email }).select("-password").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch videos uploaded by this user (using email as userId as per upload logic)
    // Note: We recently added userId field to Video, but older videos might depend on userName or not have it.
    // For now, let's query by userId (email) which we set in upload.
    // For now, let's query by userId (email) which we set in upload.
    // Query by userId (email) OR userName (legacy check) because older videos might only have the userName saved.
    const userName = session.user.email.split("@")[0];
    let videos = await Video.find({
      $or: [
        { userId: session.user.email },
        { userName: userName }
      ]
    }).sort({ createdAt: -1 }).lean();

    // Backfill userId for legacy videos
    videos = videos.map(video => ({
      ...video,
      userId: video.userId || session.user.email,
    }));

    // Calculate stats
    const totalVideos = videos.length;
    const totalViews = videos.reduce((acc, video) => acc + (Number(video.views) || 0), 0);
    const totalLikes = videos.reduce((acc, video) => acc + (video.likes?.length || 0), 0);
    const followersCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;

    return NextResponse.json({
      user: {
        ...user,
        followersCount,
        followingCount,
      },
      videos,
      stats: {
        totalVideos,
        totalViews,
        totalLikes,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
