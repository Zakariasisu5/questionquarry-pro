import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Upload, Send, Bot, User, Trash2, Copy, Loader2, FileText, Sparkles } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const StudyAssistant = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [input]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setUploadedFile(text);
        toast({
          title: "File uploaded successfully",
          description: `${file.name} - You can now ask questions about it`,
        });
      };
      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to read file",
        variant: "destructive",
      });
    }
  };

  const clearChat = () => {
    setMessages([]);
    setUploadedFile(null);
    setFileName("");
    toast({
      title: "Chat cleared",
      description: "All messages have been removed",
    });
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const streamChat = async (userMessage: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to use the study assistant",
        variant: "destructive",
      });
      return;
    }

    const contextMessage = uploadedFile 
      ? `Context from uploaded file:\n${uploadedFile.substring(0, 3000)}\n\nUser question: ${userMessage}`
      : userMessage;

    const chatMessages = [
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: contextMessage }
    ];

    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: chatMessages }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantMessage;
                  return newMessages;
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    streamChat(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            AI Study Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload study materials and get instant AI-powered explanations and solutions
          </p>
        </div>

        <div className="grid gap-4 mb-4 md:grid-cols-2">
          <Card className="card-academic">
            <CardContent className="p-4">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".txt,.md"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadedFile ? "Change File" : "Upload Study Material"}
              </Button>
              {uploadedFile && fileName && (
                <div className="mt-3 p-2 bg-primary/10 rounded-md flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary truncate flex-1">{fileName}</span>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-academic">
            <CardContent className="p-4">
              <Button
                onClick={clearChat}
                variant="outline"
                className="w-full"
                disabled={messages.length === 0 || isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Chat History
              </Button>
              {messages.length > 0 && (
                <p className="mt-3 text-xs text-center text-muted-foreground">
                  {messages.length} message{messages.length !== 1 ? 's' : ''} in conversation
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="card-academic h-[calc(100vh-380px)] min-h-[500px]">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground max-w-md">
                    <Bot className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-semibold mb-2">Ready to help you study!</h3>
                    <p className="text-sm mb-4">
                      Upload a study file or start asking questions about your coursework
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium mb-1">📚 Upload Materials</p>
                        <p className="text-muted-foreground">Add .txt or .md files</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="font-medium mb-1">💬 Ask Questions</p>
                        <p className="text-muted-foreground">Get instant answers</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 group ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Bot className="w-5 h-5 text-primary-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1 max-w-[85%]">
                        <div
                          className={`p-4 rounded-2xl shadow-sm ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed text-sm">
                            {message.content || (
                              <span className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Thinking...
                              </span>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyMessage(message.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-fit self-end"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <User className="w-5 h-5 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={uploadedFile ? "Ask about your study material..." : "Type your question here..."}
                  rows={1}
                  disabled={isLoading}
                  className="resize-none min-h-[44px] max-h-32"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  size="lg"
                  className="px-4"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudyAssistant;