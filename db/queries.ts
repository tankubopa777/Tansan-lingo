import { cache } from "react";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

import db from "@/db/drizzle";
import { courses } from "@/db/schema";
import { userProgress } from "@/db/schema";

export const getUserProgress = cache(async () => {
    const { userId } = await auth()

    if (!userId) {
        return null;
    }

    const data = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
    return data[0] || null;
});

export const getCourses = cache(async () => {
    const data = await db.select().from(courses);
    return data;
});