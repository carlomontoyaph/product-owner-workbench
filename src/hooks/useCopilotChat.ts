"use client";
import { useState, useCallback } from "react";
import type { StageId } from "@/lib/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useCopilotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (userMessage: string, stage: StageId, contextData?: unknown) => {
      const userMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: "user",
        content: userMessage,
      };
      setMessages((m) => [...m, userMsg]);
      setLoading(true);

      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/copilot/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage, userMessage, chatHistory: history, context: contextData }),
        });

        if (!res.body) throw new Error("no-stream");

        const aiMsg: ChatMessage = {
          id: Math.random().toString(36).slice(2),
          role: "assistant",
          content: "",
        };
        setMessages((m) => [...m, aiMsg]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(Boolean);
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.content) {
                  setMessages((m) =>
                    m.map((msg) =>
                      msg.id === aiMsg.id
                        ? { ...msg, content: msg.content + parsed.content }
                        : msg
                    )
                  );
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        }
      } catch (err) {
        console.warn("[Copilot] chat error:", err);
        setMessages((m) => [
          ...m,
          {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: "Sorry, I couldn't connect right now. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, loading, sendMessage, clearMessages };
}
