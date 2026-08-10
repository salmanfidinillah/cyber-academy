import React, { useEffect, useRef } from "react";
import { Bot, ExternalLink, Send, Sparkles } from "lucide-react";
import { AiTutorMarkdown } from "../AiTutorMarkdown";
import { LessonDrawer } from "./LessonDrawer";

type AiAnswer = {
  role: "user" | "ai";
  text: string;
};

interface LessonAiPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  aiQuery: string;
  onQueryChange: (value: string) => void;
  aiAnswers: AiAnswer[];
  isAiLoading: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onOpenFullScreen: () => void;
}

export const LessonAiPanel: React.FC<LessonAiPanelProps> = ({
  isOpen,
  onClose,
  lessonTitle,
  aiQuery,
  onQueryChange,
  aiAnswers,
  isAiLoading,
  onSubmit,
  onOpenFullScreen,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const messagesEnd = messagesEndRef.current;
    if (messagesEnd && typeof messagesEnd.scrollIntoView === "function") {
      messagesEnd.scrollIntoView({ block: "nearest" });
    }
  }, [aiAnswers.length, isAiLoading, isOpen]);

  return (
    <LessonDrawer
      id="lesson-ai-panel"
      isOpen={isOpen}
      onClose={onClose}
      title="AI Tutor Materi"
      description={`Konteks aktif: ${lessonTitle}`}
      side="right"
      mobileFullscreen
    >
      <div className="flex h-full min-h-0 flex-col bg-pastel-blue/15">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-brand-border/30 bg-white/80 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-brand-muted">
            <Sparkles className="size-4 shrink-0 text-brand-text" aria-hidden="true" />
            <span className="truncate">Tanyakan bagian materi yang belum dipahami</span>
          </div>
          <button
            type="button"
            onClick={onOpenFullScreen}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-black bg-white px-2.5 py-1.5 font-heading text-[11px] font-bold shadow-[2px_2px_0_0_#111111] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-pastel-mint focus-visible:ring-offset-2 motion-reduce:transform-none"
          >
            <span>Layar Penuh</span>
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <div
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5"
          aria-live="polite"
          aria-busy={isAiLoading}
          aria-label="Percakapan dengan AI Tutor"
        >
          {aiAnswers.map((answer, index) => {
            const isUser = answer.role === "user";
            return (
              <div
                key={`${answer.role}-${index}`}
                className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-pastel-yellow" aria-hidden="true">
                    <Bot className="size-4" />
                  </span>
                )}
                <div
                  className={`max-w-[85%] overflow-hidden rounded-2xl border-2 border-black p-3 text-sm font-medium leading-relaxed shadow-[2px_2px_0_0_#111111] ${
                    isUser ? "bg-pastel-blue" : "bg-white"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{answer.text}</p>
                  ) : (
                    <AiTutorMarkdown text={answer.text} />
                  )}
                </div>
              </div>
            );
          })}
          {isAiLoading && (
            <div className="flex items-end gap-2" role="status">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-black bg-pastel-yellow" aria-hidden="true">
                <Bot className="size-4" />
              </span>
              <div className="rounded-2xl border-2 border-dashed border-brand-border bg-white p-3 text-sm font-semibold italic text-brand-muted">
                AI sedang merumuskan saran aman...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        <form
          onSubmit={onSubmit}
          className="flex shrink-0 items-end gap-2 border-t-3 border-black bg-[#FFFDF8] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
          data-testid="lesson-ai-composer"
        >
          <label htmlFor="lesson-ai-input" className="sr-only">
            Pertanyaan untuk AI Tutor
          </label>
          <input
            id="lesson-ai-input"
            type="text"
            disabled={isAiLoading}
            value={aiQuery}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Tanyakan materi..."
            className="min-w-0 flex-1 rounded-xl border-[3px] border-black bg-white px-3 py-2.5 text-base font-semibold text-brand-text outline-none placeholder:text-brand-muted focus-visible:ring-4 focus-visible:ring-pastel-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
          />
          <button
            type="submit"
            disabled={isAiLoading || !aiQuery.trim()}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border-[3px] border-black bg-pastel-blue shadow-[3px_3px_0_0_#111111] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-pastel-mint focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
            aria-label="Kirim pertanyaan ke AI Tutor"
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </LessonDrawer>
  );
};
