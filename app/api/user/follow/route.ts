import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/db";
import User from "@/model/User";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { targetUserId } = await request.json();

        if (!targetUserId) {
            return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
        }

        if (session.user.email === targetUserId) {
            return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ email: session.user.email });
        const targetUser = await User.findOne({ email: targetUserId });

        if (!currentUser || !targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isFollowing = currentUser.following.includes(targetUserId);

        if (isFollowing) {
            // Unfollow
            currentUser.following = currentUser.following.filter(
                (id: string) => id !== targetUserId
            );
            targetUser.followers = targetUser.followers.filter(
                (id: string) => id !== session.user.email
            );
        } else {
            // Follow
            currentUser.following.push(targetUserId);
            targetUser.followers.push(session.user.email);
        }

        await currentUser.save();
        await targetUser.save();

        return NextResponse.json({
            isFollowing: !isFollowing,
            followersCount: targetUser.followers.length,
        });
    } catch (error) {
        console.error("Error toggling follow:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
