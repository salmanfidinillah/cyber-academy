export function deriveLessonCompletionFlags(courseProgress: any): {
  didCourseComplete: boolean;
  didFinishAllLessons: boolean;
} {
  const status = courseProgress?.status;
  const lessonsCompleted = !!courseProgress?.lessonsCompleted;
  const didCourseComplete = status === "completed";
  const didFinishAllLessons = lessonsCompleted && !didCourseComplete;
  return { didCourseComplete, didFinishAllLessons };
}
