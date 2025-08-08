"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, MessageSquare, History, X, Loader2, AlertCircle, LogIn, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

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
  const router = useRouter();
  const { user, signOut } = useAuth();
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

  const fetchChatHistory = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?userId=${user.id}`)

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
  }, [user])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      setError(null)
      setChatHistory([])
      return
    }
    fetchChatHistory()
  }, [user, fetchChatHistory])

  const handleChatSelect = (sessionId: string) => {
    router.push(`/${sessionId}`, { scroll: false });
  };

  const handleClick = () => {
    if (user) {
      onNewChat?.()
      // Immediately try to refresh history after starting a new chat
      fetchChatHistory()
      if (isMobile) onClose()
    } else {
      router.push("/auth")
    }
  }

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
        onClick={handleClick}
        className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 cursor-pointer"
        variant="outline"
      >
        {user ? (
          <>
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </>
        ) : (
          <>
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </>
        )}
      </Button>
    </div>

      <Separator className="bg-gray-700" />

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="h-full">
          <div className="p-4 space-y-1">
            <div className="flex items-center text-sm text-gray-400 mb-3">
              <History className="h-4 w-4 mr-2" />
              Recent Chats
            </div>
            
            {/* Conditional Rendering for Loading, Error, and Data states */}
            {loading && user && (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            )}

            {error && user && (
              <div className="text-red-400 bg-red-900/30 p-3 rounded-md flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!loading && user && !error && chatHistory.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-4">No recent chats.</div>
            )}

            {user && !loading && !error && chatHistory.map((chat) => (
              <Button
                key={chat.sessionId} // Use sessionId as the key
                variant="ghost"
                className="w-full justify-start text-left hover:bg-gray-800 text-gray-300 hover:text-white p-3 h-auto cursor-pointer"
                onClick={() => {
                  handleChatSelect(chat.sessionId)
                  if (isMobile) onClose()
                }}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0 mr-3" />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{chat.title}</div>
                </div>
              </Button>
            ))}

            {!user && (
              <div className="text-center text-sm text-gray-400 py-4">
                Sign in to see your chat history.
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* Footer */}
      <div className="p-4">
        {user && (
          <Button
            className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 cursor-pointer"
            variant="outline"
            onClick={() => {
              signOut()
              if (isMobile) onClose()
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-80 border-0">
          <SheetTitle></SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 w-80",
      )}
    >
      <SidebarContent />
    </div>
  )
}
