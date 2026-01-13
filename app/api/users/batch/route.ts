
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/db";
import User from "@/model/User";

export async function POST(req: NextRequest) {
    try {
        const { ids } = await req.json();
        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
        }

        await connectToDatabase();

        // Safety check: ensure we handle potential email ids if legacy, but ideally ids are ObjectIds.
        // However, our follow logic saves ObjectIds as strings.
        const users = await User.find({ _id: { $in: ids } }).select("_id email name");

        return NextResponse.json({ users });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
