"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  files?: File[]
}

interface StreamInitiateResponse {
  streamId: string
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const startNewChat = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
    setMessages([])
    console.log("Started new chat with sessionId:", newSessionId)
  }, [])

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (!sessionId) {
      startNewChat()
    }
  }, [sessionId, startNewChat])

  const sendMessage = useCallback(
    async (content: string, files: File[] = []) => {
      if (!content.trim() && files.length === 0) return

      setIsLoading(true)

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
        if (sessionId) formData.append("sessionId", sessionId)
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

        // --- FIX 1: Correctly handle the end of the stream ---
        eventSource.onerror = (err) => {
          // This event fires when the stream is closed by the server, which is normal.
          // We don't need to log it as a critical error.
          console.log("EventSource stream closed.");
          eventSource.close()
          eventSourceRef.current = null
          setIsLoading(false) // Set loading to false when the stream ends.
        }
        
      } catch (error) {
        console.error("Error sending message:", error)
        const errorMessageContent = error instanceof Error ? error.message : "Sorry, an unknown error occurred."
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
    [sessionId],
  )

  // Memoize the return value to prevent unnecessary re-renders
  const chatState = useMemo(() => ({
    messages,
    isLoading,
    sendMessage,
    sessionId,
    startNewChat,
  }), [messages, isLoading, sendMessage, sessionId, startNewChat])

  return chatState
}
