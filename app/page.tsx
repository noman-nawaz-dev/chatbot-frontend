"use client"

import { useState, useRef } from "react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatInterface, ChatInterfaceRef } from "@/components/chat-interface"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const chatInterfaceRef = useRef<ChatInterfaceRef>(null)

  const handleNewChat = () => {
    chatInterfaceRef.current?.startNewChat()
  }

  return (
    <div className="fixed inset-0 flex h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
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
