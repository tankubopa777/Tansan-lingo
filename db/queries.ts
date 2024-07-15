import { cache } from "react";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

import db from "@/db/drizzle";
import { challengeProgress, challenges, courses, lessons, units, userProgress } from "@/db/schema";
import { challengeProgressRelations } from './schema';

export const getUserProgress = cache(async () => {
    const { userId } = await auth()

    if (!userId) {
        return null;
    }

    const data = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
    return data[0] || null;
});

export const getUnits = cache(async () => {
    const { userId } = await auth();
    const userProgress = await getUserProgress();

    if (!userId || !userProgress?.activeCourseId) {
        return [];
    }

    // TODO: Confirm whether order is needed
    const data = await db.query.units.findMany({
        where: eq(units.courseId, userProgress.activeCourseId),
        with: {
            lessons: {
                with: {
                    challenges: {
                        with: {
                            challengeProgress: true,
                        },
                    },
                },
            }
        }
    })

    const normalizedData = data.map((unit) => {
        const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
            const allCompletedChallenges = lesson.challenges.every((challenge) =>
                challenge.challengeProgress
                && challenge.challengeProgress.length > 0
                && challenge.challengeProgress.every((progress) => progress.completed)
            );

            return { ...lesson, completed: allCompletedChallenges };
        });

        return { ...unit, lessons: lessonsWithCompletedStatus };
    });
    return normalizedData;
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

export const getCourseProgress = cache(async () => {
    const { userId } = await auth();
    const userProgress = await getUserProgress();

    if (!userId || !userProgress?.activeCourseId) {
        return null;
    }

    const unitsInActiveCourse = await db.query.units.findMany({
        orderBy: (units, { asc }) => [asc(units.order)],
        where: eq(units.courseId, userProgress.activeCourseId),
        with: {
            lessons: {
                orderBy: (lessons, { asc }) => [asc(lessons.order)],
                with: {
                    unit: true,
                    challenges: {
                        with: {
                            challengeProgress: {
                                where: eq(challengeProgress.userId, userId),
                            },
                        }
                    },
                },
            }
        }
    });

    const firstUncompletedLesson = unitsInActiveCourse
        .flatMap((unit) => unit.lessons)
        .find((lesson) => {
            return lesson.challenges.some((challenge) => {
                return (
                    !challenge.challengeProgress ||
                    challenge.challengeProgress.length === 0 ||
                    challenge.challengeProgress.some((progress) => !progress.completed)
                );
            });
        });

    return {
        activeLesson: firstUncompletedLesson,
        activeLessonId: firstUncompletedLesson?.id,
    };
});

export const getLesson = cache(async (id?: number) => {
    const { userId } = await auth();

    if (!userId) {
        return null;
    }

    const courseProgress = await getCourseProgress();

    const lessonId = id || courseProgress?.activeLessonId;

    if (!lessonId) {
        return null;
    }

    const data = await db.query.lessons.findFirst({
        where: eq(lessons.id, lessonId),
        with: {
            challenges: {
                orderBy: (challenges, { asc }) => [asc(challenges.order)],
                with: {
                    challengeOptions: true,
                    challengeProgress: {
                        where: eq(challengeProgress.userId, userId),
                    },
                },
            },
        },
    })

    if (!data || !data.challenges) {
        return null;
    }

    const normalizedChallenges = data.challenges.map((challenge) => {
        const completed = challenge.challengeProgress && challenge.challengeProgress.length > 0 && challenge.challengeProgress.every((progress) => progress.completed);

        return { ...challenge, completed };
    });

    return { ...data, challenges: normalizedChallenges };
})