
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/db";
import User from "@/model/User";
import Video from "@/model/Vdeo";

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Find user to get ID and Email
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Cascade Delete:
        // 1. Delete all videos uploaded by user
        await Video.deleteMany({
            $or: [
                { userId: user.email }, // Legacy check
                { userId: user._id.toString() }
            ]
        });

        // 2. Remove user from followers/following lists of others
        await User.updateMany(
            {},
            {
                $pull: {
                    followers: user._id.toString(),
                    following: user._id.toString()
                }
            }
        );

        // 3. Delete the user
        await User.findByIdAndDelete(user._id);

        return NextResponse.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to delete account" },
            { status: 500 }
        );
    }
}
