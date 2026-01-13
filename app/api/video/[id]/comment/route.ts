import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import Video from "@/model/Vdeo";
import { connectToDatabase } from "@/utils/db";

// Add a comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { text } = await request.json();
        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { error: "Comment text is required" },
                { status: 400 }
            );
        }

        await connectToDatabase();
        const { id } = await params;

        const video = await Video.findById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        if (!video.comments) {
            video.comments = [];
        }

        const newComment = {
            userId: session.user.email,
            userName: session.user.name || session.user.email,
            text: text.trim(),
            createdAt: new Date(),
        };

        video.comments.push(newComment);
        await video.save();

        return NextResponse.json({
            comment: newComment,
            totalComments: video.comments.length,
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        return NextResponse.json(
            { error: "Failed to add comment" },
            { status: 500 }
        );
    }
}

// Get all comments
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const video = await Video.findById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        return NextResponse.json({
            comments: video.comments || [],
            totalComments: video.comments?.length || 0,
        });
    } catch (error) {
        console.error("Error getting comments:", error);
        return NextResponse.json(
            { error: "Failed to get comments" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { commentId } = await req.json();

        if (!commentId) {
            return NextResponse.json({ error: "Comment ID required" }, { status: 400 });
        }

        await connectToDatabase();

        const video = await Video.findById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Find the comment
        const comment = video.comments.find((c: any) => c._id.toString() === commentId);
        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        // Check permissions
        const isVideoOwner = video.userId === session.user.email;
        // Comment userId stores email as per POST method
        const isCommentOwner = comment.userId === session.user.email;

        if (!isVideoOwner && !isCommentOwner) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Remove comment
        video.comments = video.comments.filter((c: any) => c._id.toString() !== commentId);
        await video.save();

        return NextResponse.json({ message: "Comment deleted" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return NextResponse.json(
            { error: "Failed to delete comment" },
            { status: 500 }
        );
    }
}
