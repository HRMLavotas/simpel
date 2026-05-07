import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UsageStats {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [pendingRequest, setPendingRequest] = useState(false);
  const { toast } = useToast();

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pendingRequest) {
        logger.info('Tab became visible with pending request');
        // Request is still running in background, just log it
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pendingRequest]);

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Add user message to chat
    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userChatMessage]);
    setIsLoading(true);
    setPendingRequest(true);

    // Retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session');
        }

        // Prepare chat history (last 10 messages for context)
        const history = messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        // Get Supabase URL and anon key
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Use native fetch with keepalive to prevent cancellation when tab is inactive
        const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            message: userMessage,
            history,
          }),
          // keepalive ensures request continues even if tab is inactive
          keepalive: true,
          // Increase timeout for AI processing
          signal: AbortSignal.timeout(60000), // 60 seconds timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // Add assistant response to chat
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Update usage stats
        if (data.usage) {
          setUsage(data.usage);
        }

        // Success - exit retry loop
        setIsLoading(false);
        setPendingRequest(false);
        return;

      } catch (error: any) {
        lastError = error;
        logger.error(`AI chat attempt ${attempt + 1} failed:`, error);

        // If it's the last attempt, don't retry
        if (attempt === maxRetries - 1) {
          break;
        }

        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        const waitTime = Math.pow(2, attempt) * 1000;
        logger.info(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // All retries failed
    logger.error('All AI chat attempts failed:', lastError);
    
    // Add error message to chat
    const errorMessage: ChatMessage = {
      id: `error-${Date.now()}`,
      role: 'assistant',
      content: `Maaf, terjadi kesalahan: ${lastError?.message || 'Tidak dapat menghubungi AI'}. Silakan coba lagi.`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, errorMessage]);
    
    toast({
      title: 'Error',
      description: 'Gagal mengirim pesan ke AI setelah beberapa percobaan',
      variant: 'destructive',
    });

    setIsLoading(false);
    setPendingRequest(false);
  }, [messages, toast]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setUsage(null);
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  return {
    messages,
    isLoading,
    usage,
    sendMessage,
    clearChat,
    deleteMessage,
  };
}
