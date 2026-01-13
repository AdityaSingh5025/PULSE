import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Video from "@/model/Vdeo";
import { connectToDatabase } from "@/utils/db";

// Toggle like on a video
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const { id } = await params;
        const userId = session.user.email;

        const video = await Video.findById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        if (!video.likes) {
            video.likes = [];
        }

        const likeIndex = video.likes.indexOf(userId);
        if (likeIndex > -1) {
            video.likes.splice(likeIndex, 1);
        } else {
            video.likes.push(userId);
        }

        await video.save();

        return NextResponse.json({
            likes: video.likes.length,
            isLiked: video.likes.includes(userId),
        });
    } catch (error) {
        console.error("Error toggling like:", error);
        return NextResponse.json(
            { error: "Failed to toggle like" },
            { status: 500 }
        );
    }
}

// Get like status
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        await connectToDatabase();

        const { id } = await params;
        const video = await Video.findById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        const userId = session?.user?.email || "";
        const isLiked = video.likes?.includes(userId) || false;

        return NextResponse.json({
            likes: video.likes?.length || 0,
            isLiked,
        });
    } catch (error) {
        console.error("Error getting like status:", error);
        return NextResponse.json(
            { error: "Failed to get like status" },
            { status: 500 }
        );
    }
}
