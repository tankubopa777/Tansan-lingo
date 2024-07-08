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

export const getCourseById = cache(async (courseId: number) => {
    const data = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    return data[0] || null;
});

export const getUserProgressWithCourse = async () => {
    const result = await db
        .select({
            userProgress: userProgress,
            course: courses,
        })
        .from(userProgress)
        .leftJoin(courses, eq(userProgress.activeCourseId, courses.id))
        .limit(1);

    if (result.length === 0) {
        return null;
    }

    const { userProgress: userData, course } = result[0];

    return {
        ...userData,
        activeCourse: course,
    };
};