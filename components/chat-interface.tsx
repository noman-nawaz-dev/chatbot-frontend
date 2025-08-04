"use client"

import type React from "react"
import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo, memo } from "react"
import { Send, Paperclip, Loader2, Menu, Copy, Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { useChat } from "@/hooks/use-chat"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
// @ts-ignore
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
// @ts-ignore
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"

interface ChatInterfaceProps {
  onToggleSidebar: () => void
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  files?: File[]
}

export interface ChatInterfaceRef {
  startNewChat: () => void
}

// Memoized markdown components to prevent unnecessary re-renders
const MarkdownComponents = {
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-xl md:text-2xl font-bold mb-4 mt-6 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-lg md:text-xl font-bold mb-3 mt-5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-base md:text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h3>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mb-4 pl-6 list-disc space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mb-4 pl-6 list-decimal space-y-1">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-700 font-semibold text-left">
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
      {children}
    </td>
  ),
  br: () => <br className="my-1" />,
  hr: () => <hr className="my-6 border-gray-300 dark:border-gray-600" />,
}

// Memoized message component
const MessageComponent = memo(({
  message
}: {
  message: Message
}) => {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  const CodeComponent = useCallback(({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");
    const codeId = `code-${codeString.slice(0, 20)}`;

    if (!inline && match) {
      return (
        <div className="relative group my-4">
          <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-md">
            <span className="text-sm text-gray-300 font-medium">
              {match[1].toUpperCase()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
              onClick={() => handleCopy(codeString, codeId)}
            >
              {copiedStates[codeId] ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <SyntaxHighlighter
            style={oneDark as any}
            language={match[1]}
            PreTag="div"
            className="!mt-0 !rounded-t-none"
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <code
        className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }, [handleCopy, copiedStates]);

  const markdownComponents = useMemo(() => ({
    ...MarkdownComponents,
    code: CodeComponent
  }), [CodeComponent]);

  return (
    <div
      className={cn("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] md:max-w-[90%] lg:max-w-[85%] xl:max-w-[80%] rounded-lg px-3 md:px-4 py-2 md:py-3 relative group",
          message.role === "user"
            ? "bg-blue-600 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white",
        )}
      >
        {message.role === "assistant" && message.content.trim().length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={() => handleCopy(message.content, message.id)}
          >
            {copiedStates[message.id] ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}

        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
          <ReactMarkdown
            linkTarget="_blank"
            components={markdownComponents}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.files && message.files.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 space-y-1">
            {message.files.map((file, index) => (
              <div key={index} className="text-xs md:text-sm opacity-75 flex items-center">
                <Paperclip className="h-3 w-3 mr-1" />
                {file.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

MessageComponent.displayName = "MessageComponent";

// Memoized input component
const ChatInput = memo(({
  input,
  setInput,
  handleSubmit,
  handleKeyDown,
  isLoading,
  files,
  setFiles,
  fileInputRef
}: {
  input: string
  setInput: (value: string) => void
  handleSubmit: (e: React.FormEvent) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  isLoading: boolean
  files: File[]
  setFiles: (files: File[]) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) => {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 md:p-4">
      <div className="w-full max-w-5xl mx-auto">
        {files.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-2 md:px-3 py-1 text-xs md:text-sm"
              >
                <Paperclip className="h-3 w-3 mr-1" />
                <span className="truncate max-w-[120px] md:max-w-none">{file.name}</span>
                <button
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  className="ml-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-32 resize-none pr-12 text-sm md:text-base"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          <Button
            type="submit"
            size="icon"
            disabled={(!input.trim() && files.length === 0) || isLoading}
            className="h-11 w-11 flex-shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              setFiles(Array.from(e.target.files))
            }
          }}
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
        />
      </div>
    </div>
  )
})

ChatInput.displayName = "ChatInput";

export const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(
  ({ onToggleSidebar }, ref) => {
    const [input, setInput] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatAreaRef = useRef<HTMLDivElement>(null);
    const wasAtBottomRef = useRef(true);

    const { messages, isLoading, sendMessage, startNewChat } = useChat();

    useImperativeHandle(ref, () => ({
      startNewChat
    }), [startNewChat]);

    const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'smooth') => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    }, []);

    const handleScroll = useCallback(() => {
        const chatArea = chatAreaRef.current;
        if (chatArea) {
            const { scrollTop, scrollHeight, clientHeight } = chatArea;
            const atBottom = scrollHeight - scrollTop - clientHeight < 100;
            setIsAtBottom(atBottom);
            wasAtBottomRef.current = atBottom;
        }
    }, []);

    useEffect(() => {
        const chatArea = chatAreaRef.current;
        if (wasAtBottomRef.current) {
            scrollToBottom('auto');
        }
        
        if (chatArea) {
            chatArea.addEventListener('scroll', handleScroll);
            return () => {
                chatArea.removeEventListener('scroll', handleScroll);
            }
        }
    }, [messages, handleScroll, scrollToBottom]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() && files.length === 0) return;

      scrollToBottom('smooth');
      await sendMessage(input, files);
      setInput("");
      setFiles([]);
    }, [input, files, sendMessage, scrollToBottom]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    }, [handleSubmit]);

    const welcomeContent = useMemo(() => (
      <div className="text-center py-8 md:py-12">
        <div className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          How can I help you today?
        </div>
        <div className="text-gray-600 dark:text-gray-400 mb-6 md:mb-8 text-sm md:text-base">
          Upload files, ask questions, or start a conversation
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-w-2xl mx-auto">
           <Card className="p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
            <div className="font-medium mb-2 text-sm md:text-base">📄 Analyze Documents</div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Upload PDFs, Word docs, or text files for analysis
            </div>
          </Card>
          <Card className="p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
            <div className="font-medium mb-2 text-sm md:text-base">🖼️ Process Images</div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Upload images for description and analysis
            </div>
          </Card>
          <Card className="p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
            <div className="font-medium mb-2 text-sm md:text-base">💬 Ask Questions</div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Get answers to any questions you have
            </div>
          </Card>
          <Card className="p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
            <div className="font-medium mb-2 text-sm md:text-base">📊 Data Analysis</div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Upload CSV or Excel files for insights
            </div>
          </Card>
        </div>
      </div>
    ), []);

    return (
      <div className="flex flex-col h-full w-full relative">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 z-10">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="hidden md:flex">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {messages.length === 0 ? "New Chat" : "Chat Session"}
            </h2>
          </div>
        </div>

        <div
          ref={chatAreaRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-white dark:bg-gray-900"
        >
          <div className="w-full max-w-5xl mx-auto px-4 py-6">
            {messages.length === 0 && welcomeContent}

            <div className="space-y-4 md:space-y-6">
              {messages.map((message) => (
                <MessageComponent
                  key={message.id}
                  message={message}
                />
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] md:max-w-[90%] lg:max-w-[85%] xl:max-w-[80%] bg-gray-100 dark:bg-gray-800 rounded-lg px-3 md:px-4 py-2 md:py-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {!isAtBottom && (
          <div className="absolute bottom-24 right-4 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollToBottom('smooth')}
              className="rounded-full shadow-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              Scroll to bottom
            </Button>
          </div>
        )}

        <div className="z-10">
            <ChatInput
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              handleKeyDown={handleKeyDown}
              isLoading={isLoading}
              files={files}
              setFiles={setFiles}
              fileInputRef={fileInputRef}
            />
        </div>
      </div>
    );
  }
);

ChatInterface.displayName = "ChatInterface";

export const MemoizedChatInterface = memo(ChatInterface);
