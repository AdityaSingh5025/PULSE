import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import User from "@/model/User";
import { connectToDatabase } from "@/utils/db";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userIdToBlock } = await req.json();
        if (!userIdToBlock) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        await connectToDatabase();

        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if already blocked
        const isBlocked = currentUser.blockedUsers?.includes(userIdToBlock);

        if (isBlocked) {
            // Unblock
            currentUser.blockedUsers = currentUser.blockedUsers.filter((id: string) => id !== userIdToBlock);
        } else {
            // Block
            // Prevent blocking self
            if (currentUser._id.toString() === userIdToBlock) {
                return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
            }
            if (!currentUser.blockedUsers) currentUser.blockedUsers = [];
            currentUser.blockedUsers.push(userIdToBlock);

            // Optional: Also unfollow if blocked?
            // For now, let's keep it simple.
        }

        await currentUser.save();

        return NextResponse.json({
            message: isBlocked ? "User unblocked" : "User blocked",
            isBlocked: !isBlocked
        }, { status: 200 });

    } catch (error) {
        console.error("Error blocking user:", error);
        return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userIdToCheck = searchParams.get('userId');

        if (!userIdToCheck) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        await connectToDatabase();
        const currentUser = await User.findOne({ email: session.user.email });

        const isBlocked = currentUser?.blockedUsers?.includes(userIdToCheck) || false;

        return NextResponse.json({ isBlocked }, { status: 200 });
    } catch (error) {
        console.error("Error checking block status:", error);
        return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
    }
}
