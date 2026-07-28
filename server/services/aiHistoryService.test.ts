import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../firebaseAdmin", () => {
  const store: Record<string, Record<string, any>> = {
    aiConversations: {
      "conversation-1": { conversationId: "conversation-1", userId: "user-1" },
    },
    aiMessages: {},
  };
  let generated = 0;

  const collection = (name: string) => ({
    doc: (requestedId?: string) => {
      const id = requestedId || `generated-${++generated}`;
      const ref = {
        id,
        get: async () => ({
          id,
          exists: Boolean(store[name]?.[id]),
          data: () => store[name]?.[id],
          ref,
        }),
      };
      return ref;
    },
  });

  const adminDb = {
    __store: store,
    collection,
    batch: () => {
      const creates: Array<{ ref: any; data: any }> = [];
      return {
        create: (ref: any, data: any) => creates.push({ ref, data }),
        update: vi.fn(),
        commit: async () => {
          if (creates.some(({ ref }) => store.aiMessages[ref.id])) {
            throw Object.assign(new Error("already exists"), { code: 6 });
          }
          for (const { ref, data } of creates) store.aiMessages[ref.id] = data;
        },
      };
    },
  };

  return { adminDb, adminAuth: {} };
});

import { adminDb } from "../firebaseAdmin";
import { saveExchange } from "./aiHistoryService";

describe("AI Firestore history idempotency", () => {
  const store = (adminDb as any).__store;

  beforeEach(() => {
    store.aiMessages = {};
  });

  it("does not duplicate user/assistant messages when persistence is retried", async () => {
    const requestId = "8d86d02c-0728-4cd0-b779-4f3b2e456999";
    await saveExchange("user-1", "conversation-1", "Halo", '{"answer":"Hai"}', "safe", requestId);
    await saveExchange("user-1", "conversation-1", "Halo", '{"answer":"Hai"}', "safe", requestId);
    expect(Object.keys(store.aiMessages)).toHaveLength(2);
    expect(Object.values(store.aiMessages).map((message: any) => message.role).sort()).toEqual([
      "assistant",
      "user",
    ]);
  });

  it("still stores a later intentional exchange with a different request ID", async () => {
    await saveExchange(
      "user-1",
      "conversation-1",
      "Pertanyaan pertama",
      '{"answer":"Jawaban pertama"}',
      "safe",
      "8d86d02c-0728-4cd0-b779-4f3b2e456991"
    );
    await saveExchange(
      "user-1",
      "conversation-1",
      "Pertanyaan kedua",
      '{"answer":"Jawaban kedua"}',
      "safe",
      "8d86d02c-0728-4cd0-b779-4f3b2e456992"
    );
    expect(Object.keys(store.aiMessages)).toHaveLength(4);
  });

  it("returns 404 for a conversation that is not owned by the authenticated UID", async () => {
    await expect(
      saveExchange(
        "other-user",
        "conversation-1",
        "Halo",
        '{"answer":"Hai"}',
        "safe",
        "8d86d02c-0728-4cd0-b779-4f3b2e456993"
      )
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

