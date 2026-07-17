import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  Slide,
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
  OpenInNew as OpenInNewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
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
const MINIMIZED_BAR_HEIGHT = 64;

// ── Page-aware suggestion chips ────────────────────────────────────────────

interface RouteSuggestions {
  primary: string[];
  secondary: string[];
}

const DEFAULT_SUGGESTIONS: RouteSuggestions = {
  primary: ['How do I manage users?', 'Explain the dashboard', 'Security best practices'],
  secondary: ['What is Vestara?', 'How to export data?', 'Application settings guide'],
};

const ROUTE_SUGGESTIONS: Record<string, RouteSuggestions> = {
  '/': {
    primary: ['Explain the dashboard KPIs', 'Show recent activity', 'What do the metrics mean?'],
    secondary: ['How many users are active?', 'Any errors recently?', 'Storage overview'],
  },
  '/users': {
    primary: ['How do I manage users?', 'Create a new admin user', 'Show active users'],
    secondary: ['What roles are available?', 'Export user list', 'Bulk user operations'],
  },
  '/settings': {
    primary: ['What settings are configured?', 'How to export settings?', 'Explain JSON values'],
    secondary: ['Import settings guide', 'Settings audit history', 'Security-related settings'],
  },
  '/files': {
    primary: ['Show file storage stats', 'Recent uploads', 'How to organize files?'],
    secondary: ['File size breakdown', 'Storage provider info', 'Upload best practices'],
  },
  '/chat': {
    primary: ['How does the AI work?', 'What models are available?', 'Change AI model'],
    secondary: ['Conversation management', 'Chat history tips', 'Keyboard shortcuts'],
  },
  '/system-logs': {
    primary: ['Explain audit logs', 'Filter by action type', 'Error log analysis'],
    secondary: ['Security events', 'User activity tracking', 'Log retention settings'],
  },
  '/analytics': {
    primary: ['Analytics overview', 'User growth trends', 'Platform metrics'],
    secondary: ['Revenue data', 'Engagement stats', 'Report generation'],
  },
  '/organizations': {
    primary: ['Organization management', 'Multi-tenancy overview', 'Organization settings'],
    secondary: ['Create organization', 'Member management', 'Org roles and permissions'],
  },
  '/profile': {
    primary: ['Update my profile', 'Change my password', 'Account security'],
    secondary: ['OAuth linked accounts', 'Profile settings', 'Notification preferences'],
  },
  '/docs': {
    primary: ['Find documentation', 'API reference', 'Developer guide'],
    secondary: ['Deployment guide', 'Architecture docs', 'Getting started'],
  },
};

function getSuggestionsForPath(pathname: string): RouteSuggestions {
  // Try exact match first
  if (ROUTE_SUGGESTIONS[pathname]) {
    return ROUTE_SUGGESTIONS[pathname];
  }
  // Fall back to prefix match (e.g., /users/123 -> /users)
  const prefix = '/' + pathname.split('/')[1];
  if (prefix !== '/' && ROUTE_SUGGESTIONS[prefix]) {
    return ROUTE_SUGGESTIONS[prefix];
  }
  return DEFAULT_SUGGESTIONS;
}

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
            bgcolor: isUser ? theme.palette.primary.main : alpha(theme.palette.grey[500], 0.06),
            color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
            border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
          }}
        >
          {isUser ? (
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.8125rem' }}
            >
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
                '& hr': {
                  border: 'none',
                  borderTop: `1px solid ${theme.palette.divider}`,
                  my: 0.5,
                },
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </Box>
          )}
        </Paper>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            mt: 0.25,
            justifyContent: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.625rem' }}>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
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
  suggestions,
}: {
  onSuggestionClick: (text: string) => void;
  theme: Theme;
  suggestions: RouteSuggestions;
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
      {/* Primary suggestions */}
      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        {suggestions.primary.slice(0, 3).map((suggestion) => (
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
        ))}
      </Box>
      {/* Secondary suggestions row */}
      {suggestions.secondary.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          {suggestions.secondary.slice(0, 3).map((suggestion) => (
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
          ))}
        </Box>
      )}
    </Box>
  );
}

// ── Floating Chat Widget ────────────────────────────────────────────────────

export function FloatingChatWidget() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const minimizedInputRef = useRef<HTMLInputElement>(null);

  // Compute page-aware suggestions
  const suggestions = useMemo(() => getSuggestionsForPath(location.pathname), [location.pathname]);

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

  // Last assistant message for minimized bar preview
  const lastAssistantMessage = useMemo(() => {
    const reversed = [...messages].reverse();
    return reversed.find((m) => m.role === 'assistant');
  }, [messages]);

  const lastMessagePreview = lastAssistantMessage
    ? lastAssistantMessage.content.replace(/[*#`>\[\]]/g, '').slice(0, 80) +
      (lastAssistantMessage.content.length > 80 ? '...' : '')
    : null;

  // ── Keyboard shortcut (Cmd/Ctrl + Shift + K) ────────────────────────────
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'K') {
        // Don't toggle if the user is typing in an input/textarea
        const activeElement = document.activeElement;
        if (
          activeElement &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.getAttribute('contenteditable') === 'true')
        ) {
          return;
        }
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  // Focus input when panel opens or conversation changes
  useEffect(() => {
    if (open && !minimized && activeConversationId) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open, minimized, activeConversationId]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
    setMinimized(false);
  };

  const handleClose = () => {
    setOpen(false);
    setMinimized(false);
  };

  const handleMinimize = () => {
    setMinimized(true);
  };

  const handleExpandFromBar = () => {
    setMinimized(false);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleOpenFullPage = () => {
    navigate('/chat');
    setOpen(false);
    setMinimized(false);
  };

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 200);
  }, []);

  // Pick the most recent non-archived conversation when opening
  useEffect(() => {
    if (open && !minimized && !activeConversationId && conversations.length > 0) {
      const active = conversations.find((c) => !c.isArchived);
      if (active) {
        setActiveConversationId(active.id);
      }
    }
  }, [open, minimized, activeConversationId, conversations]);

  const handleSuggestionClick = useCallback(
    (text: string) => {
      setInputValue(text);
      setTimeout(() => {
        if (minimized) {
          minimizedInputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }, 50);
    },
    [minimized],
  );

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
        // Expand if minimized when sending
        if (minimized) {
          setMinimized(false);
        }
      } catch {
        // Error handled by mutation
      }
    } else {
      sendMessage.mutate({
        conversationId: activeConversationId,
        data: { content },
      });
    }
  }, [inputValue, isSending, activeConversationId, createConversation, sendMessage, minimized]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isFullPanel = open && !minimized;
  const isMinimizedBar = open && minimized;

  return (
    <>
      {/* Floating Action Button — visible when panel is fully closed */}
      <Zoom in={!open} unmountOnExit>
        <Tooltip title="AI Assistant (⌘⇧K)" placement="left">
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

      {/* Minimized Bar — visible when panel is minimized */}
      <Slide direction="up" in={isMinimizedBar} mountOnEnter unmountOnExit>
        <Paper
          elevation={6}
          onClick={handleExpandFromBar}
          sx={{
            position: 'fixed',
            bottom: { xs: 0, sm: 24 },
            right: { xs: 0, sm: 24 },
            left: { xs: 0, sm: 'auto' },
            zIndex: 1499,
            width: { xs: '100%', sm: PANEL_WIDTH },
            height: MINIMIZED_BAR_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 1,
            borderRadius: { xs: 0, sm: 2 },
            bgcolor: theme.palette.background.paper,
            border: { xs: 'none', sm: `1px solid ${theme.palette.divider}` },
            cursor: 'pointer',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        >
          <SparkleIcon sx={{ color: theme.palette.primary.main, fontSize: 18, flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <Typography
              variant="caption"
              fontWeight={700}
              noWrap
              sx={{ fontSize: '0.7rem', lineHeight: 1.2 }}
            >
              {activeConversationId ? (conversationData?.title ?? 'AI Assistant') : 'AI Assistant'}
            </Typography>
            {lastMessagePreview ? (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}
              >
                {lastMessagePreview}
              </Typography>
            ) : (
              <Typography
                variant="caption"
                color="text.disabled"
                noWrap
                sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}
              >
                Tap to open assistant...
              </Typography>
            )}
          </Box>
          <Tooltip title="Expand">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleExpandFromBar();
              }}
              sx={{ width: 24, height: 24, flexShrink: 0 }}
            >
              <ExpandLessIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              sx={{ width: 24, height: 24, flexShrink: 0 }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Paper>
      </Slide>

      {/* Full Chat Panel — visible when open and not minimized */}
      <Fade in={isFullPanel} timeout={200}>
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
              gap: 0.5,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <SparkleIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ flex: 1, fontSize: '0.85rem' }}
              noWrap
            >
              {activeConversationId ? (conversationData?.title ?? 'Loading...') : 'AI Assistant'}
            </Typography>

            {/* Minimize to bar */}
            <Tooltip title="Minimize (⌘⇧K)">
              <IconButton size="small" onClick={handleMinimize} sx={{ width: 28, height: 28 }}>
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            {/* Open in full page */}
            <Tooltip title="Open in full page">
              <IconButton size="small" onClick={handleOpenFullPage} sx={{ width: 28, height: 28 }}>
                <OpenInNewIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>

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
              <IconButton size="small" onClick={handleClose} sx={{ width: 28, height: 28 }}>
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
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
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
              <MiniEmptyState
                onSuggestionClick={handleSuggestionClick}
                theme={theme}
                suggestions={suggestions}
              />
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
                            bgcolor: inputValue.trim() ? theme.palette.primary.dark : undefined,
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
