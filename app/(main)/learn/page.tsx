import { redirect } from "next/navigation";
import { Header } from "./header"
import { FeedWrapper } from "@/components/feed-wrapper";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { UserProgress } from "@/components/user-progress";
import { getLessonPercentage, getUserProgressWithCourse } from "@/db/queries";
import { getUnits } from "@/db/queries";
import { getCourseProgress } from "@/db/queries";
import { Unit } from "./unit";

const LearnPage = async () => {
    const userProgressData = getUserProgressWithCourse();
    const courseProgressData = getCourseProgress();
    const lessonPercentageData = getLessonPercentage();
    const unitsData = getUnits();


    const [
        userProgress,
        units,
        courseProgress,
        lessonPercentage
    ] = await Promise.all([userProgressData, unitsData, courseProgressData, lessonPercentageData]);
    if (!userProgress || !userProgress.activeCourse) {
        redirect("/courses");
    }

    if (!courseProgress) {
        redirect("/courses")
    }

    return (
        <div className="flex flex-row-reverse gap-[48px] px-6">
            <StickyWrapper>
                <UserProgress
                    activeCourse={userProgress.activeCourse}
                    hearts={userProgress.hearts}
                    points={userProgress.points}
                    hasActiveSubscription={false}
                />
            </StickyWrapper>
            <FeedWrapper>
                <Header title={userProgress.activeCourse.title} />
                {units.map((unit) => (
                    <div key={unit.id} className="mb-10">
                        <Unit
                            id={unit.id}
                            order={unit.order}
                            description={unit.description}
                            title={unit.title}
                            lessons={unit.lessons}
                            activeLesson={courseProgress.activeLesson}
                            activeLessonPercentage={lessonPercentage}
                        />
                    </div>
                ))}
            </FeedWrapper>
        </div>

    );
}

export default LearnPage;