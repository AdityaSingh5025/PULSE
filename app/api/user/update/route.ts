
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/db";
import User from "@/model/User";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, username, image } = body;

        await connectToDatabase();

        // Check if username is taken (if being updated)
        if (username) {
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser.email !== session.user.email) {
                return NextResponse.json({ error: "Username already taken" }, { status: 400 });
            }
        }

        const updatedUser = await User.findOneAndUpdate(
            { email: session.user.email },
            { $set: { name, username, image } },
            { new: true }
        ).select("-password");

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
