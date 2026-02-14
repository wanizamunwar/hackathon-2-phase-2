"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth";
import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const userId = session?.user?.id;
  if (!userId) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <ChatInterface userId={userId} mode="full" />
    </div>
  );
}
