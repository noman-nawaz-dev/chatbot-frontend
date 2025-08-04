"use client"

import { useState, useEffect } from "react"
import { Plus, MessageSquare, History, Settings, HelpCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  onNewChat?: () => void
}

interface ChatHistoryItem {
  id: string
  title: string
  timestamp: Date
}

export function ChatSidebar({ isOpen, onToggle, onClose, onNewChat }: ChatSidebarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [chatHistory] = useState<ChatHistoryItem[]>([
    // Mock data - you'll replace this with real data from your backend
    { id: "1", title: "How to build a React app", timestamp: new Date() },
    { id: "2", title: "NestJS backend integration", timestamp: new Date(Date.now() - 86400000) },
    { id: "3", title: "File upload handling", timestamp: new Date(Date.now() - 172800000) },
    { id: "4", title: "Mobile responsive design", timestamp: new Date(Date.now() - 259200000) },
    { id: "5", title: "API integration patterns", timestamp: new Date(Date.now() - 345600000) },
  ])

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-lg font-semibold">AI Chat</h1>
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-gray-800">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button
          onClick={() => {
            onNewChat?.()
            if (isMobile) onClose()
          }}
          className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      <Separator className="bg-gray-700" />

      {/* Chat History */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            <div className="flex items-center text-sm text-gray-400 mb-3">
              <History className="h-4 w-4 mr-2" />
              Recent Chats
            </div>

            {chatHistory.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className="w-full justify-start text-left hover:bg-gray-800 text-gray-300 hover:text-white p-3 h-auto"
                onClick={() => {
                  // This will be handled by the chat interface
                  if (isMobile) onClose()
                }}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0 mr-3" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{chat.title}</div>
                  {/* <div className="text-xs text-gray-500 mt-1">{chat.timestamp.toLocaleDateString()}</div> */}
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator className="bg-gray-700" />

      {/* Footer */}
      <div className="p-4 space-y-2">
        <Button variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white">
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white">
          <HelpCircle className="h-4 w-4 mr-3" />
          Help
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-80 border-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700",
        isOpen ? "w-80" : "w-0 overflow-hidden",
      )}
    >
      <SidebarContent />
    </div>
  )
}
