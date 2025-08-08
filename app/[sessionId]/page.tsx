"use client"

import { useEffect, useState } from "react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { MemoizedChatInterface as ChatInterface } from "@/components/chat-interface"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"


export default function ChatSessionPage({ params }: { params: { sessionId: string } }) {
  // Keep sidebar closed by default when landing on a specific session
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { sessionId } = useParams()
  const isMobile = useIsMobile()

  const handleNewChat = () => {
    router.push("/")
  }

  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  return (
    <div className="fixed inset-0 flex h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        userId={user?.id ?? ""}
      />
      <main className="flex-1 flex flex-col min-w-0 relative">
        <ChatInterface
          sessionId={Array.isArray(sessionId) ? sessionId[0] : sessionId}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </main>
    </div>
  )
}
