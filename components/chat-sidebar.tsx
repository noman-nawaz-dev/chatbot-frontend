"use client"

import { useState, useEffect } from "react"
import { Plus, MessageSquare, History, Settings, HelpCircle, X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface ChatSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  onNewChat?: () => void
  userId: string
}

interface ChatHistoryItem {
  sessionId: string
  title: string
  created_at: string
}

export function ChatSidebar({ isOpen, onToggle, onClose, onNewChat, userId }: ChatSidebarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768)
    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      setError("User ID is not provided.")
      return
    }

    const fetchChatHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?userId=${userId}`) // Adjust the URL if needed

        if (!response.ok) {
          throw new Error(`Failed to fetch chat history: ${response.statusText}`)
        }

        const data: ChatHistoryItem[] = await response.json()
        setChatHistory(data)
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchChatHistory()
  }, [userId]) // Re-run the effect if the userId changes

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
        <div className="h-full">
          <div className="p-4 space-y-1">
            <div className="flex items-center text-sm text-gray-400 mb-3">
              <History className="h-4 w-4 mr-2" />
              Recent Chats
            </div>
            
            {/* Conditional Rendering for Loading, Error, and Data states */}
            {loading && (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            )}

            {error && (
              <div className="text-red-400 bg-red-900/30 p-3 rounded-md flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!loading && !error && chatHistory.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-4">No recent chats.</div>
            )}

            {!loading && !error && chatHistory.map((chat) => (
              <Button
                key={chat.sessionId} // Use sessionId as the key
                variant="ghost"
                className="w-full justify-start text-left hover:bg-gray-800 text-gray-300 hover:text-white p-3 h-auto"
                onClick={() => {
                  // Handle navigating to this specific chat
                  // e.g., onChatSelect(chat.sessionId)
                  if (isMobile) onClose()
                }}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0 mr-3" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{chat.title}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
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
