import Video, { videoInterface } from "@/model/Vdeo";
import User from "@/model/User";
import { authOptions } from "@/utils/authOptions";
import { connectToDatabase } from "@/utils/db";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();

    const videos = await Video.find().sort({ createdAt: -1 }).lean();

    if (!videos || videos.length === 0) {
      return NextResponse.json({ videos: [] }, { status: 200 });
    }

    return NextResponse.json({ videos }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body: videoInterface = await request.json();

    if (
      !body.title ||
      !body.videoUrl ||
      !body.description
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const user = await User.findOne({ email: session.user.email });

    const videodata = {
      ...body,
      userId: session.user.email,
      userName: user?.email.split("@")[0] || "User", // Fallback name logic or use user.name if available
      controls: body?.controls ?? true,
      transformation: {
        height: 1920,
        width: 1080,
        quality: body?.transformation?.quality || "100",
      },
    };
    const newVideo = await Video.create(videodata);

    return NextResponse.json({ newVideo }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
