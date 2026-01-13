import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/db";
import Video from "@/model/Vdeo";

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
        await connectToDatabase();

        const video = await Video.findById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Check ownership
        // video.userId stores the email of the uploader
        if (video.userId !== session.user.email) {
            return NextResponse.json(
                { error: "You are not authorized to delete this video" },
                { status: 403 }
            );
        }

        await Video.findByIdAndDelete(id);

        return NextResponse.json(
            { message: "Video deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting video:", error);
        return NextResponse.json(
            { error: "Failed to delete video" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { title, description } = await req.json();

        await connectToDatabase();

        const video = await Video.findById(id);
        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        if (video.userId !== session.user.email) {
            return NextResponse.json(
                { error: "You are not authorized to edit this video" },
                { status: 403 }
            );
        }

        // Update fields
        video.title = title || video.title;
        video.description = description || video.description;
        await video.save();

        return NextResponse.json({ message: "Video updated successfully", video }, { status: 200 });
    } catch (error) {
        console.error("Error updating video:", error);
        return NextResponse.json(
            { error: "Failed to update video" },
            { status: 500 }
        );
    }
}
