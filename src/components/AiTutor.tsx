import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  AlertCircle,
  BookOpen,
  ShieldAlert,
  Sparkles,
  History,
  X,
  Menu,
  CheckCircle,
  Shield,
  HelpCircle
} from "lucide-react";
import { NeoCard } from "./NeoCard";
import { NeoButton } from "./NeoButton";
import { NeoBadge } from "./NeoBadge";
import {
  getAiConversations,
  createAiConversation,
  deleteAiConversation,
  getAiMessages,
  sendAiMessage
} from "../lib/learningStore";
import { fetchMyQuizAttempts } from "../services/quizService";
import { User, AiConversation, AiMessage, TutorResponse } from "../types";
import { lessons, courses } from "../data";
import { questions } from "../quiz_data";

interface AiTutorProps {
  currentUser: User;
  onNavigate: (route: string) => void;
  selectedConversationId?: string;
}

export const AiTutor: React.FC<AiTutorProps> = ({
  currentUser,
  onNavigate,
  selectedConversationId
}) => {
  // States
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [activeConv, setActiveConv] = useState<AiConversation | null>(null);
  const [inputText, setInputText] = useState("");
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [convNotFound, setConvNotFound] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load all conversations
  const loadConversations = async (selectId?: string) => {
    setErrorMsg(null);
    try {
      const list = await getAiConversations(currentUser.uid);
      setConversations(list);
      setConvNotFound(false);

      if (selectedConversationId) {
        const matched = list.find(c => c.conversationId === selectedConversationId);
        if (!matched) {
          setConvNotFound(true);
          setActiveConv(null);
          setMessages([]);
          return;
        }
      }
      
      if (list.length > 0) {
        let selected = list[0];
        if (selectId) {
          const matched = list.find(c => c.conversationId === selectId);
          if (matched) selected = matched;
        } else if (selectedConversationId) {
          const matched = list.find(c => c.conversationId === selectedConversationId);
          if (matched) selected = matched;
        }
        setActiveConv(selected);
        loadMessages(selected.conversationId);
      } else {
        // Automatically create a general conversation if none exists
        handleCreateNewConversation("general");
      }
    } catch (err: any) {
      console.error("Gagal memuat percakapan:", err);
      setErrorMsg(err.message || "Gagal memuat daftar percakapan.");
    }
  };

  // Load messages for a conversation
  const loadMessages = async (convId: string) => {
    setLoadingConv(true);
    setErrorMsg(null);
    try {
      const msgs = await getAiMessages(currentUser.uid, convId);
      setMessages(msgs);
    } catch (err: any) {
      console.error("Gagal memuat pesan:", err);
      setErrorMsg(err.message || "Gagal memuat pesan.");
    } finally {
      setLoadingConv(false);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingSend]);

  useEffect(() => {
    loadConversations();
  }, [selectedConversationId]);

  // Create new General Conversation
  const handleCreateNewConversation = async (
    type: "general" | "lesson" | "remedial" | "simulation" = "general",
    learningPathId?: string,
    courseId?: string,
    lessonId?: string,
    title?: string
  ) => {
    try {
      const conv = await createAiConversation(
        currentUser.uid,
        type,
        learningPathId,
        courseId,
        lessonId,
        title
      );
      // Reload and set newly created conversation as active
      const list = await getAiConversations(currentUser.uid);
      setConversations(list);
      setActiveConv(conv);
      setMessages([]);
      onNavigate(`/ai-tutor/${conv.conversationId}`);
    } catch (err: any) {
      console.error("Gagal membuat percakapan baru:", err);
      setErrorMsg(err.message || "Gagal membuat percakapan baru.");
    }
  };

  // Delete Conversation
  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (window.confirm("Apakah Anda yakin ingin menghapus riwayat obrolan ini?")) {
      try {
        await deleteAiConversation(currentUser.uid, convId);
        // If active conversation is deleted, clear or load the next one
        if (activeConv?.conversationId === convId) {
          setActiveConv(null);
          setMessages([]);
          loadConversations();
        } else {
          loadConversations(activeConv?.conversationId);
        }
      } catch (err: any) {
        console.error("Gagal menghapus obrolan:", err);
        setErrorMsg(err.message || "Gagal menghapus obrolan.");
      }
    }
  };

  // Select Conversation
  const handleSelectConversation = (conv: AiConversation) => {
    setActiveConv(conv);
    loadMessages(conv.conversationId);
    setShowMobileHistory(false);
    onNavigate(`/ai-tutor/${conv.conversationId}`);
  };

  // Send Message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !activeConv) return;
    setLoadingSend(true);
    setErrorMsg(null);
    setInputText("");

    try {
      // Find context info from conversation properties
      let contextInfo: any = {};
      if (activeConv.contextType === "lesson" && activeConv.lessonId) {
        const matchedLesson = lessons.find(l => l.id === activeConv.lessonId);
        const matchedCourse = matchedLesson ? courses.find(c => c.id === matchedLesson.courseId) : null;
        contextInfo.lessonTitle = matchedLesson ? matchedLesson.title : activeConv.title.replace("Tutor Lesson: ", "");
        contextInfo.lessonSummary = matchedLesson ? matchedLesson.content : "Materi pelajaran aktif tentang keamanan siber defensif.";
        if (matchedCourse) {
          contextInfo.courseTitle = matchedCourse.title;
        }
      } else if (activeConv.contextType === "remedial" && activeConv.courseId) {
        const matchedCourse = courses.find(c => c.id === activeConv.courseId);
        if (matchedCourse) {
          contextInfo.courseTitle = matchedCourse.title;
          const attempts = (await fetchMyQuizAttempts()).filter((attempt) => attempt.courseId === activeConv.courseId);
          const failedAttempt = attempts.find(a => a.resultStatus === "remedial_required" || a.resultStatus === "almost_passed" || !a.passed);
          if (failedAttempt && failedAttempt.incorrectQuestionIds) {
            const incorrectQuestions = questions.filter(q => failedAttempt.incorrectQuestionIds.includes(q.id));
            contextInfo.quizIncorrectTopics = incorrectQuestions.map(q => q.questionText);
          }
        }
      } else if (activeConv.contextType === "simulation") {
        contextInfo.simulationDetails = {
          name: activeConv.title || "Review Simulasi Keamanan",
          instruction: "Berikan review defensif berdasarkan skenario pengguna tanpa mengajarkan eksploitasi."
        };
      }

      await sendAiMessage(currentUser.uid, activeConv.conversationId, textToSend, contextInfo);
      
      // Reload messages & list to update timestamps
      await loadMessages(activeConv.conversationId);
      const list = await getAiConversations(currentUser.uid);
      setConversations(list);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal mengirim pesan.");
    } finally {
      setLoadingSend(false);
    }
  };

  // Parse structured AI response stored as stringified JSON
  const renderAiMessageContent = (msg: AiMessage) => {
    if (msg.role === "user") {
      return (
        <div className="text-sm font-sans font-medium whitespace-pre-line text-brand-text break-words">
          {msg.content}
        </div>
      );
    }

    try {
      const parsed: TutorResponse & { warningMsg?: string } = JSON.parse(msg.content);

      return (
        <div className="space-y-4">
          {/* Sensitive warning banner */}
          {parsed.warningMsg && (
            <div className="p-3 bg-pastel-peach rounded-xl neo-border-thin flex items-start gap-2 text-xs font-bold text-brand-text">
              <AlertCircle className="w-4 h-4 text-pastel-red shrink-0 mt-0.5" />
              <span>{parsed.warningMsg}</span>
            </div>
          )}

          {/* Core explanation */}
          <div className="text-sm font-sans text-brand-text whitespace-pre-line break-words leading-relaxed">
            {parsed.answer}
          </div>

          {/* Quick Summary Block */}
          {parsed.summary && (
            <div className="p-3 bg-[#FAF8F5] rounded-xl border-l-4 border-pastel-mint text-xs italic text-brand-muted font-bold">
              Ringkasan AI: {parsed.summary}
            </div>
          )}

          {/* Safety guard status */}
          {parsed.safetyStatus && parsed.safetyStatus !== "safe" && (
            <div className="p-3 bg-pastel-peach/40 rounded-xl neo-border-thin flex items-center gap-2 text-xs font-bold text-brand-text">
              <ShieldAlert className="w-4 h-4 text-pastel-red shrink-0" />
              <span>
                {parsed.safetyStatus === "blocked_and_redirected"
                  ? "Sistem keamanan mengalihkan obrolan ini ke topik pertahanan siber defensif yang aman dan etis."
                  : "Pengingat Keamanan: Hindari membagikan password, OTP, atau file mencurigakan kepada siapa pun."}
              </span>
            </div>
          )}

          {/* Official support notification */}
          {parsed.requiresOfficialHelp && (
            <div className="p-3.5 bg-pastel-yellow rounded-xl neo-border flex flex-col gap-2 text-xs font-bold text-brand-text">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-brand-text" />
                <span>Rekomendasi Tindakan Serius</span>
              </div>
              <p className="text-[11px] leading-relaxed text-brand-muted">
                Untuk insiden serius yang merugikan finansial atau hukum, mohon segera hubungi kanal dukungan resmi institusi Anda atau adukan ke BSSN / Siber Polri.
              </p>
            </div>
          )}

          {/* Clickable suggested questions */}
          {parsed.suggestedQuestions && parsed.suggestedQuestions.length > 0 && (
            <div className="pt-3 border-t border-brand-muted/15">
              <p className="text-[10px] uppercase tracking-wider text-brand-muted font-heading font-extrabold mb-2">
                Pertanyaan Lanjutan yang Disarankan:
              </p>
              <div className="flex flex-wrap gap-2">
                {parsed.suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={loadingSend}
                    className="text-xs bg-white hover:bg-pastel-mint border border-brand-text px-3 py-1.5 rounded-full font-sans font-bold neo-btn-transition text-left disabled:opacity-50"
                  >
                    💡 {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } catch {
      // Fallback if not JSON stringified
      return (
        <div className="text-sm font-sans text-brand-text whitespace-pre-line break-words">
          {msg.content}
        </div>
      );
    }
  };

  // Mode badge helpers
  const getContextBadgeDetails = (type: string) => {
    switch (type) {
      case "lesson":
        return { text: "Lesson Mode", color: "bg-pastel-lavender", icon: <BookOpen className="w-3 h-3" /> };
      case "remedial":
        return { text: "Remedial Assistant", color: "bg-pastel-peach", icon: <AlertCircle className="w-3 h-3" /> };
      case "simulation":
        return { text: "Simulation Review", color: "bg-pastel-yellow", icon: <ShieldAlert className="w-3 h-3" /> };
      default:
        return { text: "General Mode", color: "bg-pastel-mint", icon: <Shield className="w-3 h-3" /> };
    }
  };

  const badgeDetails = activeConv ? getContextBadgeDetails(activeConv.contextType) : { text: "General Mode", color: "bg-pastel-mint", icon: <Shield className="w-3 h-3" /> };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 font-sans min-h-[calc(100vh-140px)] flex flex-col">
      
      {/* Page Title & Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-brand-text">
              AI Tutor
            </h1>
            <NeoBadge bgColor="bg-pastel-mint">Gemini Powered</NeoBadge>
          </div>
          <p className="text-xs sm:text-sm text-brand-muted font-bold leading-relaxed">
            Asisten keamanan siber defensif personal untuk memandu perjalanan belajarmu secara aman dan menyenangkan.
          </p>
        </div>
        <NeoButton variant="secondary" onClick={() => onNavigate("/dashboard")} className="text-xs py-2 px-3">
          Dashboard
        </NeoButton>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow">
        
        {/* Sidebar History (Desktop) */}
        <div className="hidden lg:flex flex-col gap-4 col-span-1">
          <NeoButton
            variant="mint"
            onClick={() => handleCreateNewConversation("general")}
            className="w-full text-xs font-bold py-3 justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Percakapan Baru
          </NeoButton>

          <NeoCard className="flex-grow flex flex-col p-4 overflow-hidden min-h-[450px]">
            <div className="flex items-center gap-2 border-b border-brand-text pb-2.5 mb-3">
              <History className="w-4.5 h-4.5 text-brand-text" />
              <h3 className="font-heading font-extrabold text-sm text-brand-text">Riwayat Obrolan</h3>
            </div>

            <div className="space-y-2 flex-grow overflow-y-auto max-h-[400px] pr-1">
              {conversations.length === 0 ? (
                <div className="text-center py-12 text-xs text-brand-muted font-bold">
                  Belum ada obrolan.
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = activeConv?.conversationId === c.conversationId;
                  const cBadge = getContextBadgeDetails(c.contextType);
                  return (
                    <div
                      key={c.conversationId}
                      onClick={() => handleSelectConversation(c)}
                      className={`group p-3 rounded-xl neo-border-thin cursor-pointer flex items-center justify-between gap-2 transition-all ${
                        isActive ? "bg-pastel-mint" : "bg-white hover:bg-brand-surface"
                      }`}
                    >
                      <div className="overflow-hidden space-y-1">
                        <p className="text-xs font-heading font-extrabold truncate text-brand-text">
                          {c.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-muted">
                          <span className={`px-1.5 py-0.5 rounded-full ${cBadge.color} text-brand-text neo-border-thin`}>
                            {cBadge.text}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(e, c.conversationId)}
                        className="text-brand-muted hover:text-pastel-red p-1 rounded-md transition-colors"
                        title="Hapus Obrolan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </NeoCard>
        </div>

        {/* Chat Area & Header */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-[450px]">
          
          <NeoCard className="flex-grow flex flex-col p-4 sm:p-5 h-full overflow-hidden">
            {convNotFound ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4 flex-grow">
                <div className="w-16 h-16 rounded-full border-3 border-brand-border bg-pastel-peach flex items-center justify-center text-2xl rotate-[-3deg]">
                  ⚠️
                </div>
                <h3 className="font-heading font-extrabold text-lg text-brand-text">
                  Akses Ditolak atau Obrolan Tidak Ditemukan
                </h3>
                <p className="text-xs text-brand-muted max-w-sm font-bold leading-relaxed">
                  Percakapan siber ini tidak ditemukan, milik pengguna lain, atau Anda tidak memiliki izin untuk membacanya.
                </p>
                <NeoButton
                  variant="mint"
                  onClick={() => {
                    setConvNotFound(false);
                    onNavigate("/ai-tutor");
                  }}
                  className="text-xs font-bold py-2 px-4"
                >
                  Kembali ke Percakapan Umum
                </NeoButton>
              </div>
            ) : (
              <>
                {/* Active chat header with Mobile menu button and context badge */}
            <div className="flex items-center justify-between border-b border-brand-text pb-3.5 mb-4">
              <div className="flex items-center gap-3">
                {/* Mobile Menu Trigger */}
                <button
                  onClick={() => setShowMobileHistory(true)}
                  className="lg:hidden p-2 rounded-xl border border-brand-text bg-white hover:bg-brand-surface neo-shadow-sm transition-all"
                  title="Lihat Riwayat"
                >
                  <Menu className="w-4 h-4" />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-[10px] font-heading font-extrabold px-2.5 py-0.5 rounded-full ${badgeDetails.color} border border-brand-text shadow-[1px_1px_0px_#111]`}>
                      {badgeDetails.icon}
                      {badgeDetails.text}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-heading font-extrabold text-brand-text truncate max-w-[200px] sm:max-w-md">
                    {activeConv ? activeConv.title : "Membuat percakapan..."}
                  </h2>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 text-xs text-brand-muted font-bold">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                <span className="text-[10px] sm:text-xs">Aktif</span>
              </div>
            </div>

            {/* Messages view wrapper */}
            <div className="flex-grow overflow-y-auto space-y-4 max-h-[350px] pr-2.5 mb-4 scrollbar-thin">
              {loadingConv ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Sparkles className="w-8 h-8 text-pastel-mint animate-spin mb-2" />
                  <p className="text-xs text-brand-muted font-bold">Memuat riwayat bimbingan Anda...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <Sparkles className="w-10 h-10 text-pastel-mint mb-3 animate-bounce" />
                  <h3 className="font-heading font-extrabold text-base text-brand-text mb-1">
                    Halo! Saya AI Tutor Anda
                  </h3>
                  <p className="text-xs text-brand-muted max-w-sm font-bold">
                    Tanyakan apa pun tentang materi pelajaran, cara menghindari phishing, sandi yang kuat, atau review latihan kuis!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={msg.messageId}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 neo-border ${
                          isUser
                            ? "bg-pastel-yellow neo-shadow-sm rounded-tr-none"
                            : "bg-white neo-shadow-sm rounded-tl-none"
                        }`}
                      >
                        <p className="text-[10px] uppercase font-heading font-black tracking-wider text-brand-muted mb-1">
                          {isUser ? "Anda" : "AI Tutor"}
                        </p>
                        {renderAiMessageContent(msg)}
                      </div>
                    </div>
                  );
                })
              )}
              {loadingSend && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-white rounded-2xl rounded-tl-none p-4 neo-border neo-shadow-sm">
                    <p className="text-[10px] uppercase font-heading font-black tracking-wider text-brand-muted mb-1">
                      AI Tutor
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-pastel-mint animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 rounded-full bg-pastel-mint animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 rounded-full bg-pastel-mint animate-bounce"></span>
                      </span>
                      <p className="text-xs text-brand-muted font-bold">Sedang memformulasikan penjelasan siber aman...</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error fallback alert banner */}
            {errorMsg && (
              <div className="p-3 bg-pastel-peach border border-brand-text rounded-xl flex items-center gap-2 text-xs font-bold text-brand-text mb-3">
                <AlertCircle className="w-4 h-4 text-pastel-red" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Text input, send button, and disclaimer */}
            <div className="mt-auto pt-2 space-y-2 border-t border-brand-muted/15">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputText);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ketik pertanyaan keamanan siber defensif Anda (maks 2.000 karakter)..."
                  disabled={loadingSend}
                  maxLength={2000}
                  className="flex-grow px-4 py-3 text-sm bg-white rounded-xl border border-brand-text outline-none focus:ring-4 focus:ring-pastel-mint focus:ring-offset-2 font-sans font-medium"
                />
                <NeoButton
                  type="submit"
                  variant="mint"
                  disabled={loadingSend || !inputText.trim()}
                  className="py-3 px-4 flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </NeoButton>
              </form>

              {/* Disclaimer */}
              <p className="text-[10px] text-brand-muted font-semibold text-center leading-relaxed">
                ⚠️ Jawaban AI dapat memiliki kekeliruan. Jangan bagikan password, OTP, token, atau data sensitif lainnya.
              </p>
            </div>
            </>
            )}
          </NeoCard>
        </div>

      </div>

      {/* Mobile Sidebar History Drawer */}
      {showMobileHistory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-start animate-fadeIn">
          <div className="w-[280px] bg-[#FFFDF8] h-full p-5 border-r border-brand-text flex flex-col animate-slideIn">
            <div className="flex items-center justify-between pb-3.5 border-b border-brand-text mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4.5 h-4.5 text-brand-text" />
                <h3 className="font-heading font-extrabold text-sm text-brand-text">Riwayat Obrolan</h3>
              </div>
              <button
                onClick={() => setShowMobileHistory(false)}
                className="p-1 rounded-md border border-brand-text bg-white hover:bg-brand-surface neo-shadow-sm transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <NeoButton
              variant="mint"
              onClick={() => {
                handleCreateNewConversation("general");
                setShowMobileHistory(false);
              }}
              className="w-full text-xs font-bold py-3 justify-center gap-2 mb-4"
            >
              <Plus className="w-4 h-4" />
              Percakapan Baru
            </NeoButton>

            <div className="space-y-2 flex-grow overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-12 text-xs text-brand-muted font-bold">
                  Belum ada obrolan.
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = activeConv?.conversationId === c.conversationId;
                  const cBadge = getContextBadgeDetails(c.contextType);
                  return (
                    <div
                      key={c.conversationId}
                      onClick={() => handleSelectConversation(c)}
                      className={`group p-3 rounded-xl neo-border-thin cursor-pointer flex items-center justify-between gap-2 transition-all ${
                        isActive ? "bg-pastel-mint" : "bg-white hover:bg-brand-surface"
                      }`}
                    >
                      <div className="overflow-hidden space-y-1">
                        <p className="text-xs font-heading font-extrabold truncate text-brand-text">
                          {c.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-muted">
                          <span className={`px-1.5 py-0.5 rounded-full ${cBadge.color} text-brand-text neo-border-thin`}>
                            {cBadge.text}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(e, c.conversationId)}
                        className="text-brand-muted hover:text-pastel-red p-1 rounded-md transition-colors"
                        title="Hapus Obrolan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div
            className="flex-grow"
            onClick={() => setShowMobileHistory(false)}
          />
        </div>
      )}

    </div>
  );
};
