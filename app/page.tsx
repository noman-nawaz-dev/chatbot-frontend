"use client"

import { useState, useRef, useEffect } from "react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { MemoizedChatInterface as ChatInterface, ChatInterfaceRef } from "@/components/chat-interface"
import { useAuth } from "@/hooks/use-auth"
import { useIsMobile } from "@/hooks/use-mobile"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const chatInterfaceRef = useRef<ChatInterfaceRef>(null)
  const isMobile = useIsMobile()

  const { user } = useAuth()
  const handleNewChat = () => {
    chatInterfaceRef.current?.startNewChat()
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
          ref={chatInterfaceRef}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
      </main>
    </div>
  )
}
