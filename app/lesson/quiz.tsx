"use client"

import { challenges, challengeOptions } from "@/db/schema"

type Props = {
    initialPercentage: number;
    initialHearts: number;
    initialLessonId: number;
    initialLessonChallenges: typeof challenges.$inferSelect & {
        completed: boolean
        challengeOption: typeof challengeOptions.$inferSelect[];
    }[];
    userSubscription: any;
};

export const Quiz = ({
    initialPercentage,
    initialHearts,
    initialLessonId,
    initialLessonChallenges,
    userSubscription,
}: Props) => {
    return (
        <div>
            Quiz!
        </div>
    )
}