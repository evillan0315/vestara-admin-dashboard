import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  CircularProgress,
  Chip,
  alpha,
  useTheme,
  useMediaQuery,
  Fade,
  Tooltip,
  Zoom,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import {
  SmartToy as BotIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Close as CloseIcon,
  AutoAwesome as SparkleIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Chat as ChatIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  useConversations,
  useConversation,
  useChatMessages,
  useCreateConversation,
  useSendMessage,
} from './hooks';
import type { ChatMessageDTO } from '@vestara/types';

// ── Constants ───────────────────────────────────────────────────────────────

const PANEL_WIDTH = 400;
const PANEL_MAX_HEIGHT = 620;

// ── Typing Indicator ────────────────────────────────────────────────────────

function MiniTypingIndicator({ theme }: { theme: Theme }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1.5 }}>
      <Avatar
        sx={{
          width: 26,
          height: 26,
          bgcolor: theme.palette.secondary.main,
          fontSize: 11,
        }}
      >
        <BotIcon sx={{ fontSize: 14 }} />
      </Avatar>
      <Paper
        elevation={0}
        sx={{
          px: 1.25,
          py: 1,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.grey[500], 0.06),
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
        }}
      >
        <CircularProgress size={12} />
        <Typography variant="caption" color="text.secondary">
          Thinking...
        </Typography>
      </Paper>
    </Box>
  );
}

// ── Message Bubble (compact) ────────────────────────────────────────────────

function MiniMessageBubble({
  message,
  isLatest,
  theme,
}: {
  message: ChatMessageDTO;
  isLatest: boolean;
  theme: Theme;
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: 1.5,
      }}
    >
      <Avatar
        sx={{
          width: 26,
          height: 26,
          bgcolor: isUser ? theme.palette.primary.main : theme.palette.secondary.main,
          fontSize: 11,
        }}
      >
        {isUser ? <PersonIcon sx={{ fontSize: 14 }} /> : <BotIcon sx={{ fontSize: 14 }} />}
      </Avatar>

      <Box sx={{ maxWidth: '85%', minWidth: 40 }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            borderRadius: 2,
            bgcolor: isUser
              ? theme.palette.primary.main
              : alpha(theme.palette.grey[500], 0.06),
            color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
            border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
          }}
        >
          {isUser ? (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8125rem' }}>
              {message.content}
            </Typography>
          ) : (
            <Box
              sx={{
                width: '100%',
                minWidth: 0,
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                '& p': { my: 0.25, fontSize: '0.8125rem' },
                '& p:first-of-type': { mt: 0 },
                '& p:last-of-type': { mb: 0 },
                '& pre': {
                  bgcolor: theme.palette.background.default,
                  p: 1,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  border: `1px solid ${theme.palette.divider}`,
                  maxWidth: '100%',
                },
                '& code': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  px: 0.5,
                  borderRadius: 0.5,
                  fontSize: '0.75rem',
                  wordBreak: 'break-word',
                },
                '& pre code': {
                  bgcolor: 'transparent',
                  px: 0,
                  wordBreak: 'normal',
                  whiteSpace: 'pre',
                },
                '& ul, & ol': {
                  pl: 1.5,
                  my: 0.25,
                },
                '& li': { mb: 0.25 },
                '& h1, & h2, & h3, & h4': {
                  mt: 1,
                  mb: 0.25,
                  fontWeight: 600,
                  wordBreak: 'break-word',
                },
                '& h1': { fontSize: '1rem' },
                '& h2': { fontSize: '0.95rem' },
                '& h3': { fontSize: '0.9rem' },
                '& h4': { fontSize: '0.85rem' },
                '& blockquote': {
                  borderLeft: `2px solid ${theme.palette.primary.main}`,
                  pl: 1,
                  ml: 0,
                  my: 0.5,
                  color: theme.palette.text.secondary,
                  fontStyle: 'italic',
                  fontSize: '0.8125rem',
                },
                '& a': { color: theme.palette.primary.main, wordBreak: 'break-all' },
                '& hr': { border: 'none', borderTop: `1px solid ${theme.palette.divider}`, my: 0.5 },
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </Box>
          )}
        </Paper>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.25, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.625rem' }}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          {!isUser && isLatest && (
            <Tooltip title={copied ? 'Copied!' : 'Copy'}>
              <IconButton size="small" onClick={handleCopy} sx={{ width: 18, height: 18 }}>
                {copied ? (
                  <CheckIcon sx={{ fontSize: 10, color: 'success.main' }} />
                ) : (
                  <CopyIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────

function MiniEmptyState({
  onSuggestionClick,
  theme,
}: {
  onSuggestionClick: (text: string) => void;
  theme: Theme;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        px: 2,
        py: 1,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SparkleIcon sx={{ fontSize: 22, color: theme.palette.primary.main }} />
      </Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.9rem' }}>
        AI Assistant
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="center"
        sx={{ maxWidth: 260, lineHeight: 1.4 }}
      >
        Ask questions about the dashboard, users, settings, or anything else.
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['How do I manage users?', 'Explain the dashboard', 'Security best practices'].map(
          (suggestion) => (
            <Chip
              key={suggestion}
              label={suggestion}
              variant="outlined"
              size="small"
              onClick={() => onSuggestionClick(suggestion)}
              sx={{
                cursor: 'pointer',
                height: 24,
                fontSize: '0.7rem',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            />
          ),
        )}
      </Box>
    </Box>
  );
}

// ── Floating Chat Widget ────────────────────────────────────────────────────

export function FloatingChatWidget() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: conversationsData } = useConversations({ perPage: 50 });
  const conversations = conversationsData?.conversations ?? [];
  const { data: conversationData } = useConversation(activeConversationId ?? '');
  const { data: messagesData, isLoading: messagesLoading } = useChatMessages(
    activeConversationId ?? '',
    { perPage: 50 },
  );
  const messages = messagesData?.messages ?? [];

  // Mutations
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
  const isSending = sendMessage.isPending;

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  // Focus input when panel opens or conversation changes
  useEffect(() => {
    if (open && activeConversationId) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, activeConversationId]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  // Pick the most recent non-archived conversation when opening
  useEffect(() => {
    if (open && !activeConversationId && conversations.length > 0) {
      const active = conversations.find((c) => !c.isArchived);
      if (active) {
        setActiveConversationId(active.id);
      }
    }
  }, [open, activeConversationId, conversations]);

  const handleSuggestionClick = useCallback((text: string) => {
    setInputValue(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isSending) return;

    setInputValue('');

    if (!activeConversationId) {
      try {
        const conversation = await createConversation.mutateAsync({
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          firstMessage: content,
        });
        setActiveConversationId(conversation.id);
      } catch {
        // Error handled by mutation
      }
    } else {
      sendMessage.mutate({
        conversationId: activeConversationId,
        data: { content },
      });
    }
  }, [inputValue, isSending, activeConversationId, createConversation, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <Zoom in={!open} unmountOnExit>
        <Tooltip title="AI Assistant" placement="left">
          <IconButton
            onClick={handleToggle}
            aria-label="Open AI Assistant"
            sx={{
              position: 'fixed',
              bottom: { xs: 16, sm: 24 },
              right: { xs: 16, sm: 24 },
              zIndex: 1500,
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
                boxShadow: `0 6px 28px ${alpha(theme.palette.primary.main, 0.55)}`,
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ChatIcon sx={{ fontSize: { xs: 22, sm: 26 } }} />
          </IconButton>
        </Tooltip>
      </Zoom>

      {/* Chat Panel */}
      <Fade in={open} timeout={200}>
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: 0, sm: 96 },
            right: { xs: 0, sm: 24 },
            zIndex: 1499,
            width: { xs: '100%', sm: PANEL_WIDTH },
            height: { xs: '100%', sm: 'auto' },
            maxHeight: { xs: '100%', sm: PANEL_MAX_HEIGHT },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.background.paper,
            borderRadius: { xs: 0, sm: 2 },
            boxShadow:
              theme.palette.mode === 'dark'
                ? `0 8px 32px ${alpha('#000', 0.5)}`
                : `0 8px 32px ${alpha('#000', 0.15)}`,
            border: { xs: 'none', sm: `1px solid ${theme.palette.divider}` },
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 1.5,
              py: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <SparkleIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1, fontSize: '0.85rem' }}>
              {activeConversationId
                ? (conversationData?.title ?? 'Loading...')
                : 'AI Assistant'}
            </Typography>

            {activeConversationId && (
              <Tooltip title="New conversation">
                <IconButton
                  size="small"
                  onClick={handleNewConversation}
                  sx={{ width: 28, height: 28 }}
                >
                  <AddIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Close">
              <IconButton
                size="small"
                onClick={handleClose}
                sx={{ width: 28, height: 28 }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              px: 1.5,
              py: 1,
              minHeight: { xs: 0, sm: 200 },
              maxHeight: { xs: undefined, sm: 380 },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {activeConversationId ? (
              <>
                {messagesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                      <CircularProgress size={20} />
                      <Typography variant="caption" color="text.secondary">
                        Loading messages...
                      </Typography>
                    </Box>
                  ))
                ) : messages.length === 0 ? (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Start a conversation
                    </Typography>
                  </Box>
                ) : (
                  messages.map((message, index) => (
                    <MiniMessageBubble
                      key={message.id}
                      message={message}
                      isLatest={index === messages.length - 1}
                      theme={theme}
                    />
                  ))
                )}
                {isSending && <MiniTypingIndicator theme={theme} />}
              </>
            ) : (
              <MiniEmptyState onSuggestionClick={handleSuggestionClick} theme={theme} />
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box
            sx={{
              px: 1.25,
              py: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={isMobile ? 3 : 3}
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SparkleIcon sx={{ color: theme.palette.primary.main, fontSize: 16 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {isSending ? (
                      <CircularProgress size={18} />
                    ) : (
                      <IconButton
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isSending}
                        size="small"
                        sx={{
                          bgcolor: inputValue.trim()
                            ? theme.palette.primary.main
                            : theme.palette.action.disabledBackground,
                          color: inputValue.trim()
                            ? theme.palette.primary.contrastText
                            : theme.palette.action.disabled,
                          width: 28,
                          height: 28,
                          '&:hover': {
                            bgcolor: inputValue.trim()
                              ? theme.palette.primary.dark
                              : undefined,
                          },
                        }}
                      >
                        <SendIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: theme.palette.background.default,
                  fontSize: '0.8125rem',
                  '& fieldset': { borderColor: theme.palette.divider },
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                },
              }}
            />
          </Box>
        </Box>
      </Fade>
    </>
  );
}

export default FloatingChatWidget;
