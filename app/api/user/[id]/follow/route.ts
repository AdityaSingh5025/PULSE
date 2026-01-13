import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import User from "@/model/User";
import { connectToDatabase } from "@/utils/db";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Target user ID to follow/unfollow
) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const { id: targetUserId } = await params;

        // Get current user (follower) and target user (followed)
        const currentUser = await User.findOne({ email: session.user.email });

        // Target can be an ID or an Email (legacy videos often store email as userId)
        let targetUser = null;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetUserId);

        if (isObjectId) {
            targetUser = await User.findById(targetUserId);
        }

        if (!targetUser) {
            targetUser = await User.findOne({ email: targetUserId });
        }

        if (!currentUser || !targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (currentUser._id.toString() === targetUser._id.toString()) {
            return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
        }

        // Initialize arrays if missing
        if (!currentUser.following) currentUser.following = [];
        if (!targetUser.followers) targetUser.followers = [];

        const isFollowing = currentUser.following.includes(targetUser._id.toString());

        if (isFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter((id: string) => id !== targetUser._id.toString());
            targetUser.followers = targetUser.followers.filter((id: string) => id !== currentUser._id.toString());
        } else {
            // Follow
            currentUser.following.push(targetUser._id.toString());
            targetUser.followers.push(currentUser._id.toString());
        }

        await Promise.all([currentUser.save(), targetUser.save()]);

        return NextResponse.json({
            isFollowing: !isFollowing,
            followerCount: targetUser.followers.length,
        });
    } catch (error) {
        console.error("Error toggling follow:", error);
        return NextResponse.json(
            { error: "Failed to toggle follow" },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession();
        await connectToDatabase();
        const { id: targetUserId } = await params;

        let targetUser = null;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(targetUserId);

        if (isObjectId) {
            targetUser = await User.findById(targetUserId);
        }

        if (!targetUser) {
            targetUser = await User.findOne({ email: targetUserId });
        }

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let isFollowing = false;
        if (session?.user?.email) {
            const currentUser = await User.findOne({ email: session.user.email });
            if (currentUser && currentUser.following) {
                isFollowing = currentUser.following.includes(targetUser._id.toString());
            }
        }

        return NextResponse.json({
            isFollowing,
            followerCount: targetUser.followers?.length || 0,
        });
    } catch (error) {
        console.error("Error getting follow status:", error);
        return NextResponse.json(
            { error: "Failed to get follow status" },
            { status: 500 }
        );
    }
}
