"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

// Interfaces remain the same
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  files?: File[]
}

interface ChatHistory {
  sessionId: string;
  title: string;
  history: {
    timestamp: string;
    userMessage: string;
    llmResponse: string;
  }[];
}

interface StreamInitiateResponse {
  streamId: string
}

export function useChat(initialSessionId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [title, setTitle] = useState<string>("New Chat")
  const [isLoading, setIsLoading] = useState(false)
  // isInitializing indicates we are fetching chat history for an existing session
  // and should not show the "Thinking..." streaming indicator
  const [isInitializing, setIsInitializing] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  // This effect handles loading history for existing chats
  useEffect(() => {
    const fetchChatHistory = async (sid: string) => {
      setIsInitializing(true)
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"
        const response = await fetch(`${backendUrl}/chat/${sid}`)

        if (!response.ok) {
          // If a session is not found, redirect to a new chat
          console.error("Session not found, starting a new chat.")
          router.push("/", { scroll: false })
          return
        }

        const data: ChatHistory = await response.json()
        const chatMessages: Message[] = data.history.flatMap((item, index) => [
          {
            id: `user_${item.timestamp}_${index}`,
            role: "user",
            content: item.userMessage,
            timestamp: new Date(item.timestamp),
          },
          {
            id: `assistant_${item.timestamp}_${index}`,
            role: "assistant",
            content: item.llmResponse,
            timestamp: new Date(item.timestamp),
          },
        ])
        setMessages(chatMessages)
        setTitle(data.title)
        setSessionId(data.sessionId)
      } catch (error) {
        console.error("Error fetching chat history:", error)
        router.push("/", { scroll: false }) // On error, navigate to a fresh chat
      } finally {
        setIsInitializing(false)
      }
    }

    if (initialSessionId) {
      fetchChatHistory(initialSessionId)
    } else {
        // We are on the root page for a new chat, reset state.
        setTitle('New Chat')
        setMessages([])
        setSessionId(null)
    }

    // Cleanup function to close EventSource connection
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [initialSessionId, router])

  // Function to navigate to the root for a new chat and reset local chat state
  const startNewChat = useCallback(() => {
    try {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    } catch (_) {
      // ignore
    }

    setMessages([])
    setSessionId(null)
    setTitle("New Chat")
    setIsLoading(false)
    setIsInitializing(false)

    router.push("/", { scroll: false })
  }, [router])

  const sendMessage = useCallback(
    async (content: string, files: File[] = []) => {
      if (!content.trim() && files.length === 0) return
      setIsLoading(true)

      let currentSessionId = sessionId
      
      // If there's no sessionId, this is the first message of a new chat.
      if (!currentSessionId) {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setSessionId(newSessionId)
        currentSessionId = newSessionId
      }

      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
        files: files.length > 0 ? files : undefined,
      }
      
      const assistantMessagePlaceholder: Message = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage, assistantMessagePlaceholder])

      try {
        const formData = new FormData()
        formData.append("message", content)
        formData.append("sessionId", currentSessionId!)
        const effectiveUserId = user?.id ?? "demo"
        formData.append("userId", effectiveUserId)
        files.forEach((file) => formData.append("files", file))

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"
        const response = await fetch(`${backendUrl}/chat`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to initiate chat stream")
        }

        const { streamId }: StreamInitiateResponse = await response.json()
        const eventSource = new EventSource(`${backendUrl}/chat/stream/${streamId}`)
        eventSourceRef.current = eventSource
        setIsLoading(false)
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data)
          if (data.chunk) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessagePlaceholder.id
                  ? { ...msg, content: msg.content + data.chunk }
                  : msg,
              ),
            )
          }
        }

        eventSource.onerror = () => {
          eventSource.close()
          eventSourceRef.current = null
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error sending message:", error)
        const errorMessageContent = error instanceof Error ? error.message : "An unknown error occurred."
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessagePlaceholder.id
              ? { ...msg, content: `Error: ${errorMessageContent}` }
              : msg,
          ),
        )
        setIsLoading(false)
      }
    },
    [sessionId, router, user?.id],
  )

  const chatState = useMemo(() => ({
    messages,
    isLoading,
    isInitializing,
    sendMessage,
    sessionId,
    startNewChat,
    title
  }), [messages, isLoading, isInitializing, sendMessage, sessionId, startNewChat, title])

  return chatState
}
