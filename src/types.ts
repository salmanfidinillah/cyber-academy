export interface Feature {
  id: string;
  title: string;
  description: string;
  iconName: string;
  bgColor: string;
}

export interface LearningPath {
  id: string;
  slug?: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  courseCount: number;
  durationMinutes: number;
  estimatedDuration?: number;
  xpReward: number;
  courses: {
    title: string;
    description: string;
    lessonsCount: number;
    completed?: boolean;
    locked?: boolean;
  }[];
  bgColor: string;
  badgeName: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProblemSolution {
  id: string;
  problem: string;
  solution: string;
  illustrationName: string;
  bgColor: string;
}

export interface Step {
  stepNumber: string;
  title: string;
  description: string;
  bgColor: string;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: "user" | "admin";
  accountStatus: "active" | "disabled" | "deleted";
  onboardingCompleted: boolean;
  totalXp: number;
  currentLevel: number;
  learningStreak: number;
  lastStudyDate: string | null;
  lastActiveAt: string | null;
  longestStreak?: number;
  createdAt: string;
  updatedAt: string;
  learningGoal?: string;
  skillLevel?: string;
  interests?: string[];
  studyTime?: string;
  bio?: string;
  providerIds?: string[];
  emailVerified?: boolean;
}

export interface Course {
  id: string;
  learningPathId: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  order: number;
  estimatedDuration: number; // in minutes
  xpReward: number;
  learningOutcomes: string[];
  lessonCount: number;
  status: "published" | "draft";
}

export interface Lesson {
  id: string;
  courseId: string;
  learningPathId: string;
  title: string;
  slug: string;
  order: number;
  objective: string;
  content: string; // Markdown text or plain text
  exampleCase?: {
    title: string;
    description: string;
  };
  securityTips?: string[];
  keyTakeaways: string[];
  estimatedDuration: number; // in minutes
  xpReward: number;
  status: "published" | "draft";
}

export interface UserProgress {
  progressId: string; // uid_contentType_contentId
  userId: string;
  contentType: "path" | "course" | "lesson";
  contentId: string;
  learningPathId?: string;
  courseId?: string;
  status: "not_started" | "in_progress" | "completed";
  progressPercent: number; // 0 - 100
  completedLessonCount?: number;
  totalLessonCount?: number;
  lessonsCompleted?: boolean;
  lastLessonId?: string | null;
  startedAt: string;
  completedAt?: string | null;
  updatedAt: string;
}

export interface XpTransaction {
  transactionId: string;
  userId: string;
  sourceType: "lesson_completion" | "quiz_pass" | "simulation_completion" | "daily_challenge" | "course_completion" | "learning_path_completion" | "quiz_first_pass";
  sourceId: string;
  amount: number;
  reason: string;
  idempotencyKey: string; // userId_sourceType_sourceId
  createdAt: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string;
  questionCount: number; // 5
  passingScore: number; // 70
  xpReward: number; // 30
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  quizId: string;
  courseId: string;
  questionText: string;
  options: QuestionOption[];
  correctOptionId?: string; // omitted by public quiz endpoints
  explanation?: string; // omitted by public quiz endpoints
  recommendedLessonId?: string | null;
  order: number;
  status: "draft" | "published" | "archived";
}

export interface QuizAttempt {
  attemptId: string;
  userId: string;
  quizId: string;
  courseId: string;
  answers: Record<string, string>; // questionId -> optionId
  correctCount: number;
  totalQuestions: number;
  score: number;
  passed: boolean;
  xpEarned: number;
  resultStatus: "remedial_required" | "almost_passed" | "passed";
  incorrectQuestionIds: string[];
  recommendedLessonIds: string[];
  remedialViewed: boolean;
  nextCourseUnlocked: boolean;
  startedAt: string;
  submittedAt: string;
  review?: Array<{
    questionId: string;
    selectedOptionId: string;
    correctOptionId: string;
    explanation: string;
    isCorrect: boolean;
  }>;
}

export interface QuizSummary {
  userId: string;
  quizId: string;
  attemptCount: number;
  bestScore: number;
  passed: boolean;
  firstPassedAt: string | null;
  lastAttemptAt: string | null;
}

export interface SimulationAttempt {
  attemptId: string;
  userId: string;
  simulationId: string;
  answers?: Record<string, string>;
  classification?: "Aman" | "Mencurigakan" | "Phishing";
  selectedIndicators?: string[];
  correctCount?: number;
  totalQuestions?: number;
  score: number;
  bestScore?: number;
  attempts?: number;
  passed: boolean;
  xpEarned: number;
  elapsedSeconds?: number;
  submittedAt: string;
}

export interface AiConversation {
  conversationId: string;
  userId: string;
  title: string;
  contextType: "general" | "lesson" | "remedial" | "simulation";
  learningPathId?: string;
  courseId?: string;
  lessonId?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface AiMessage {
  messageId: string;
  conversationId: string;
  userId: string;
  role: "user" | "assistant";
  content: string; // Will store the final text or structured structured JSON representation
  safetyStatus: "safe" | "caution" | "blocked_and_redirected" | "insufficient_context";
  createdAt: string;
}

export interface TutorResponse {
  answer: string;
  summary: string;
  suggestedQuestions: string[];
  safetyStatus: "safe" | "caution" | "blocked_and_redirected" | "insufficient_context";
  requiresOfficialHelp?: boolean;
}

export interface LearningInsight {
  summary: string;
  strongTopics: { topic: string; reason: string }[];
  improvementTopics: { topic: string; reason: string }[];
  recommendations: { type: "lesson" | "quiz" | "simulation"; id: string; title: string; reason: string }[];
  studyTip: string;
  confidence: "high" | "medium" | "low";
  createdAt: string;
}

export interface Badge {
  badgeId: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  requirementType: string;
  requirementValue: string;
  order: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  userBadgeId: string;
  userId: string;
  badgeId: string;
  badgeSlug: string;
  sourceType: string;
  sourceId: string;
  awardedAt: string;
  idempotencyKey: string;
}

export interface Certificate {
  certificateId: string;
  certificateCode: string;
  userId: string;
  recipientName: string;
  learningPathId: string;
  learningPathTitle: string;
  issuedAt: string;
  status: "active" | "revoked";
  verificationHash: string;
  pdfPath: string;
  createdAt: string;
  updatedAt: string;
}
