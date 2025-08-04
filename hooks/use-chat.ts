"use client"

import { useState, useCallback, useEffect } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  files?: File[]
}

interface ChatResponse {
  response: string
  sessionId: string
  metadata: {
    processedFiles: number
    processingTime: number
    vectorStoreHits: number
  }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  // Generate new sessionId when component mounts or when starting a new chat
  const startNewChat = useCallback(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
    setMessages([]) // Clear messages for new chat
    console.log("Generated new sessionId:", newSessionId)
  }, [])

  // Initialize with a new sessionId on first load
  useEffect(() => {
    if (!sessionId) {
      startNewChat()
    }
  }, [sessionId, startNewChat])

  const sendMessage = useCallback(
    async (content: string, files: File[] = []) => {
      if (!content.trim() && files.length === 0) return

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
        files: files.length > 0 ? files : undefined,
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const formData = new FormData()
        formData.append("message", content)

        // Always send sessionId if we have one
        if (sessionId) {
          formData.append("sessionId", sessionId)
          console.log("Sending message with sessionId:", sessionId)
        }

        files.forEach((file) => {
          formData.append("files", file)
        })

        const response = await fetch("/api/chat", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Failed to send message")
        }

        const data: ChatResponse = await response.json()

        // Update session ID if we got a new one from the backend
        if (data.sessionId && data.sessionId !== sessionId) {
          console.log("Received new sessionId from backend:", data.sessionId)
          setSessionId(data.sessionId)
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error("Error sending message:", error)

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    },
    [sessionId],
  )

  return {
    messages,
    isLoading,
    sendMessage,
    sessionId,
    startNewChat,
  }
}
