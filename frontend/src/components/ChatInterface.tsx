"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
} from "lucide-react";
import { api, ChatMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChatInterfaceProps {
  userId: string;
  mode?: "widget" | "full";
}

function ChatMessages({
  messages,
  loading,
  messagesEndRef,
}: {
  messages: ChatMessage[];
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bot className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">How can I help?</p>
            <p className="text-xs text-muted-foreground">
              Try &quot;Add a task to buy groceries&quot;
            </p>
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-3",
            msg.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {msg.role === "assistant" && (
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}
          <div
            className={cn(
              "max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap",
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            {msg.content}
          </div>
          {msg.role === "user" && (
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}

      {loading && (
        <div className="flex gap-3 justify-start">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Thinking...
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </>
  );
}

function ChatInput({
  input,
  setInput,
  loading,
  onSend,
  inputRef,
}: {
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  onSend: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={loading}
      />
      <Button
        onClick={onSend}
        disabled={loading || !input.trim()}
        size="icon"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function ChatInterface({ userId, mode = "widget" }: ChatInterfaceProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState<number | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open || mode === "full") inputRef.current?.focus();
  }, [open, mode]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await api.sendMessage(userId, text, conversationId);
      setConversationId(res.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.response },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Full-page mode
  if (mode === "full") {
    return (
      <Card className="flex flex-col h-full">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">AI Todo Assistant</span>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <ChatMessages
              messages={messages}
              loading={loading}
              messagesEndRef={messagesEndRef}
            />
          </div>
        </ScrollArea>

        {error && (
          <div className="mx-4 mb-2">
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="border-t p-4">
          <ChatInput
            input={input}
            setInput={setInput}
            loading={loading}
            onSend={handleSend}
            inputRef={inputRef}
          />
        </div>
      </Card>
    );
  }

  // Widget mode (floating)
  return (
    <>
      {open && (
        <Card className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] flex flex-col overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">AI Todo Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <ChatMessages
                messages={messages}
                loading={loading}
                messagesEndRef={messagesEndRef}
              />
            </div>
          </ScrollArea>

          {error && (
            <div className="mx-3 mb-2">
              <Alert variant="destructive" className="py-1.5">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="border-t p-3">
            <ChatInput
              input={input}
              setInput={setInput}
              loading={loading}
              onSend={handleSend}
              inputRef={inputRef}
            />
          </div>
        </Card>
      )}

      <Button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>
    </>
  );
}
