import React from "react";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock as LockIcon,
} from "lucide-react";
import { Course, Lesson } from "../../types";
import { NeoBadge } from "../NeoBadge";
import { NeoButton } from "../NeoButton";

const renderInlineText = (text: string): React.ReactNode[] => {
  const boldParts = text.split("**");
  return boldParts.map((part, partIndex) => {
    const codeParts = part.split("`");
    const renderedCode = codeParts.map((codePart, codeIndex) =>
      codeIndex % 2 === 1 ? (
        <code
          key={codeIndex}
          className="max-w-full break-words rounded border border-brand-border/30 bg-brand-surface px-1.5 py-0.5 font-mono text-[0.85em] [overflow-wrap:anywhere]"
        >
          {codePart}
        </code>
      ) : (
        codePart
      ),
    );

    return partIndex % 2 === 1 ? (
      <strong key={partIndex} className="font-extrabold text-brand-text">
        {renderedCode}
      </strong>
    ) : (
      <React.Fragment key={partIndex}>{renderedCode}</React.Fragment>
    );
  });
};

const formatLessonContent = (text: string): React.ReactNode[] => {
  if (!text) return [];

  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      nodes.push(
        <div key={`code-${index}`} className="max-w-full overflow-hidden rounded-2xl border-3 border-black bg-[#111111] shadow-[3px_3px_0_0_#B9DDFC]">
          {language && (
            <div className="border-b border-white/20 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-pastel-blue">
              {language}
            </div>
          )}
          <pre className="max-w-full overflow-x-auto p-4 text-sm leading-relaxed text-white">
            <code>{codeLines.join("\n")}</code>
          </pre>
        </div>,
      );
      continue;
    }

    const sectionHeading = trimmed.match(/^\*\*(.+)\*\*$/);
    if (sectionHeading) {
      nodes.push(
        <h2 key={`heading-${index}`} className="pt-3 font-heading text-xl font-extrabold leading-tight text-brand-text sm:text-2xl">
          {sectionHeading[1]}
        </h2>,
      );
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      nodes.push(
        <ul key={`list-${index}`} className="space-y-2 pl-1">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex items-start gap-3">
              <span className="mt-2 size-2 shrink-0 rounded-full border border-black bg-pastel-mint" aria-hidden="true" />
              <span>{renderInlineText(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      nodes.push(
        <ol key={`ordered-${index}`} className="space-y-3">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-black bg-pastel-yellow font-heading text-xs font-extrabold" aria-hidden="true">
                {itemIndex + 1}
              </span>
              <span className="pt-0.5">{renderInlineText(item)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    nodes.push(
      <p key={`paragraph-${index}`} className="break-words [overflow-wrap:anywhere]">
        {renderInlineText(trimmed)}
      </p>,
    );
    index += 1;
  }

  return nodes;
};

interface LessonReaderProps {
  course: Course;
  lesson: Lesson;
  lessonIndex: number;
  lessonCount: number;
  completedLessonCount: number;
  isCompleted: boolean;
  isCompleting: boolean;
  completeError: string | null;
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  completionActionRef: React.RefObject<HTMLElement | null>;
  centerCompletionAction: boolean;
  onNavigate: (route: string) => void;
  onComplete: () => void;
}

export const LessonReader: React.FC<LessonReaderProps> = ({
  course,
  lesson,
  lessonIndex,
  lessonCount,
  completedLessonCount,
  isCompleted,
  isCompleting,
  completeError,
  previousLesson,
  nextLesson,
  completionActionRef,
  centerCompletionAction,
  onNavigate,
  onComplete,
}) => {
  const completionPercent =
    lessonCount > 0 ? Math.round((completedLessonCount / lessonCount) * 100) : 0;
  const lessonRoute = (target: Lesson) =>
    `/learn/courses/${course.slug}/lessons/${target.slug}`;

  return (
    <div className={`mx-auto w-full max-w-[52rem] space-y-6 ${centerCompletionAction ? "pb-[50vh]" : ""}`}>
      <div className="overflow-hidden rounded-[20px] border-[3px] border-black bg-pastel-yellow shadow-[5px_5px_0_0_#111111]">
        <header className="space-y-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <NeoBadge bgColor="bg-white">
                Materi {lessonIndex + 1} dari {lessonCount}
              </NeoBadge>
              {isCompleted && <NeoBadge bgColor="bg-pastel-mint">Selesai</NeoBadge>}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-muted">
              <Clock className="size-4" aria-hidden="true" />
              <span>{lesson.estimatedDuration} menit membaca</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-brand-muted">
              {course.title}
            </p>
            <h1 className="font-heading text-3xl font-extrabold leading-[1.1] text-brand-text sm:text-4xl">
              {lesson.title}
            </h1>
            {lesson.objective && (
              <p className="max-w-3xl text-sm font-semibold leading-relaxed text-brand-text/80 sm:text-base">
                {lesson.objective}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs font-bold text-brand-muted">
              <span>Progress kelas</span>
              <span>{completedLessonCount}/{lessonCount} selesai</span>
            </div>
            <div
              className="h-4 overflow-hidden rounded-full border-2 border-black bg-white"
              role="progressbar"
              aria-label="Progress penyelesaian materi kelas"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completionPercent}
              aria-valuetext={`${completedLessonCount} dari ${lessonCount} materi selesai`}
            >
              <div
                className="h-full bg-pastel-mint transition-[width] duration-200 motion-reduce:transition-none"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </header>
      </div>

      <article
        className="lesson-reading-content min-w-0 rounded-[20px] border-[3px] border-black bg-white px-5 py-7 shadow-[5px_5px_0_0_#111111] sm:px-8 sm:py-9"
        aria-labelledby="lesson-content-title"
      >
        <h2 id="lesson-content-title" className="sr-only">
          Isi materi {lesson.title}
        </h2>

        <div className="space-y-5 text-[0.98rem] font-medium leading-[1.8] text-brand-text/90 sm:text-base">
          {formatLessonContent(lesson.content)}
        </div>

        {lesson.exampleCase && (
          <section className="mt-9 overflow-hidden rounded-2xl border-3 border-black bg-pastel-peach/25 p-5 sm:p-6" aria-labelledby="lesson-case-title">
            <h2 id="lesson-case-title" className="font-heading text-lg font-extrabold text-brand-text">
              Studi Kasus Dunia Nyata
            </h2>
            <h3 className="mt-3 font-heading text-base font-bold text-brand-text">
              {lesson.exampleCase.title}
            </h3>
            <p className="mt-2 break-words text-sm font-medium leading-relaxed text-brand-muted [overflow-wrap:anywhere] sm:text-base">
              {lesson.exampleCase.description}
            </p>
          </section>
        )}

        {lesson.securityTips && lesson.securityTips.length > 0 && (
          <section className="mt-7 rounded-2xl border-3 border-black bg-pastel-mint/25 p-5 sm:p-6" aria-labelledby="lesson-tips-title">
            <h2 id="lesson-tips-title" className="font-heading text-lg font-extrabold text-brand-text">
              Tips Pertahanan Mandiri
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold leading-relaxed text-brand-text sm:text-base">
              {lesson.securityTips.map((tip, tipIndex) => (
                <li key={tipIndex} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white text-xs" aria-hidden="true">
                    ✓
                  </span>
                  <span className="break-words [overflow-wrap:anywhere]">{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {lesson.keyTakeaways && lesson.keyTakeaways.length > 0 && (
          <section className="mt-7 border-t-2 border-brand-border/20 pt-7" aria-labelledby="lesson-takeaways-title">
            <h2 id="lesson-takeaways-title" className="font-heading text-lg font-extrabold text-brand-text">
              Ringkasan Poin Penting
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold leading-relaxed text-brand-muted sm:text-base">
              {lesson.keyTakeaways.map((takeaway, takeawayIndex) => (
                <li key={takeawayIndex} className="flex items-start gap-3">
                  <span className="mt-2 size-2 shrink-0 rotate-45 border border-black bg-pastel-yellow" aria-hidden="true" />
                  <span className="break-words [overflow-wrap:anywhere]">{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>

      <nav
        ref={completionActionRef}
        className="rounded-[20px] border-[3px] border-black bg-white p-4 shadow-[4px_4px_0_0_#111111] sm:p-5"
        aria-label="Navigasi materi"
      >
        {completeError && (
          <p
            id="lesson-complete-error"
            className="mb-4 rounded-xl border-2 border-brand-border bg-pastel-peach/30 px-3 py-2 text-center text-sm font-bold text-brand-text"
            role="alert"
          >
            {completeError}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="order-2 sm:order-1">
            {previousLesson ? (
              <NeoButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onNavigate(lessonRoute(previousLesson))}
                className="w-full justify-center sm:w-auto sm:justify-start"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span>Materi Sebelumnya</span>
              </NeoButton>
            ) : (
              <span className="hidden text-xs font-bold text-brand-muted sm:inline">
                Materi pertama
              </span>
            )}
          </div>

          <div className="order-1 sm:order-2">
            {isCompleted ? (
              <div
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-pastel-mint px-4 py-2 font-heading text-sm font-extrabold text-brand-text"
                role="status"
              >
                <CheckCircle className="size-5" aria-hidden="true" />
                <span>Materi Selesai</span>
              </div>
            ) : (
              <NeoButton
                type="button"
                variant="primary"
                size="sm"
                disabled={isCompleting}
                onClick={onComplete}
                className="w-full whitespace-normal px-5"
                aria-describedby={completeError ? "lesson-complete-error" : undefined}
              >
                <span>{isCompleting ? "Menyimpan..." : "Tandai Selesai & Klaim XP"}</span>
                <ChevronRight className="size-4" aria-hidden="true" />
              </NeoButton>
            )}
          </div>

          <div className="order-3 flex justify-end">
            {nextLesson ? (
              <NeoButton
                type="button"
                variant={isCompleted ? "primary" : "secondary"}
                size="sm"
                disabled={!isCompleted}
                onClick={() => isCompleted && onNavigate(lessonRoute(nextLesson))}
                className="w-full justify-center sm:w-auto sm:justify-end"
                aria-label={
                  isCompleted
                    ? "Buka materi berikutnya"
                    : "Materi berikutnya terkunci sampai materi ini selesai"
                }
              >
                {!isCompleted && <LockIcon className="size-3.5" aria-hidden="true" />}
                <span>Materi Berikutnya</span>
                {isCompleted && <ChevronRight className="size-4" aria-hidden="true" />}
              </NeoButton>
            ) : (
              <span className="hidden text-right text-xs font-bold text-brand-muted sm:inline">
                Materi terakhir
              </span>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};
