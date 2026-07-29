import React from "react";
import { CheckCircle, Circle, Lock as LockIcon } from "lucide-react";
import { Lesson } from "../../types";
import { LessonDrawer } from "./LessonDrawer";

interface LessonMaterialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  currentLesson: Lesson;
  courseSlug: string;
  currentUserId: string;
  userProgress: Record<string, any>;
  onNavigate: (route: string) => void;
}

export const LessonMaterialDrawer: React.FC<LessonMaterialDrawerProps> = ({
  isOpen,
  onClose,
  lessons,
  currentLesson,
  courseSlug,
  currentUserId,
  userProgress,
  onNavigate,
}) => {
  const completedCount = lessons.filter(
    (lesson) => userProgress[`${currentUserId}_lesson_${lesson.id}`]?.status === "completed",
  ).length;

  const handleSelectLesson = (lesson: Lesson) => {
    onNavigate(`/learn/courses/${courseSlug}/lessons/${lesson.slug}`);
    onClose();
  };

  return (
    <LessonDrawer
      id="lesson-material-drawer"
      isOpen={isOpen}
      onClose={onClose}
      title="Daftar Materi"
      description={`${completedCount} dari ${lessons.length} materi telah selesai`}
      side="left"
    >
      <nav className="h-full overflow-y-auto px-4 py-5 sm:px-5" aria-label="Daftar materi kelas">
        <ol className="space-y-2">
          {lessons.map((lesson, index) => {
            const isActive = lesson.id === currentLesson.id;
            const isCompleted =
              userProgress[`${currentUserId}_lesson_${lesson.id}`]?.status === "completed";
            // Preserve the existing LessonDetail lock contract exactly.
            const isLocked =
              index > 0 &&
              !userProgress[`${currentUserId}_lesson_${lessons[index - 1].id}`];

            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleSelectLesson(lesson)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`${index + 1}. ${lesson.title}${
                    isActive ? ", materi aktif" : isCompleted ? ", selesai" : isLocked ? ", terkunci" : ""
                  }`}
                  className={`group flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left font-heading text-sm font-bold outline-none transition-[transform,background-color,box-shadow] focus-visible:ring-4 focus-visible:ring-pastel-blue focus-visible:ring-offset-2 motion-reduce:transform-none ${
                    isActive
                      ? "border-black bg-[#111111] text-white shadow-[3px_3px_0_0_#B8F1D5]"
                      : isCompleted
                        ? "border-black bg-pastel-mint text-brand-text shadow-[2px_2px_0_0_#111111] hover:-translate-y-0.5"
                        : isLocked
                          ? "cursor-not-allowed border-brand-border/25 bg-brand-surface text-brand-muted opacity-65"
                          : "border-black bg-white text-brand-text shadow-[2px_2px_0_0_#111111] hover:-translate-y-0.5 hover:bg-pastel-blue/40"
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                      isActive ? "border-white bg-pastel-mint text-black" : "border-black bg-white"
                    }`}
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 break-words leading-snug">{lesson.title}</span>
                  {isCompleted ? (
                    <CheckCircle className={`size-5 shrink-0 ${isActive ? "text-pastel-mint" : "text-brand-text"}`} aria-hidden="true" />
                  ) : isLocked ? (
                    <LockIcon className="size-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <Circle className={`size-4 shrink-0 ${isActive ? "text-pastel-mint" : "text-brand-muted"}`} aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </LessonDrawer>
  );
};
