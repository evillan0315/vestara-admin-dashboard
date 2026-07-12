import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Skeleton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  MoreVert as MoreIcon,
  Chat as ChatIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  useConversations,
  useConversation,
  useChatMessages,
  useCreateConversation,
  useSendMessage,
  useRenameConversation,
  useDeleteConversation,
  useToggleArchive,
} from '../features/chat/hooks';
import type { ChatMessageDTO, ChatConversationDTO } from '@vestara/types';

// ── Styles ──────────────────────────────────────────────────────────────────

const SIDEBAR_WIDTH = 320;

const ChatContainer = Box;

const SidebarContainer = Paper;

const MessageContainer = Box;

const MessageBubble = Paper;

// ── Conversation Sidebar ────────────────────────────────────────────────────

interface ConversationSidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  conversations: ChatConversationDTO[];
  loading: boolean;
}

function ConversationSidebar({
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  conversations,
  loading,
}: ConversationSidebarProps) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversationDTO | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const renameMutation = useRenameConversation();
  const deleteMutation = useDeleteConversation();
  const archiveMutation = useToggleArchive();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, conversation: ChatConversationDTO) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedConversation(conversation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRename = () => {
    if (selectedConversation) {
      setRenameValue(selectedConversation.title);
      setRenameDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleRenameSubmit = () => {
    if (selectedConversation && renameValue.trim()) {
      renameMutation.mutate(
        { id: selectedConversation.id, title: renameValue.trim() },
        { onSuccess: () => setRenameDialogOpen(false) },
      );
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (selectedConversation) {
      deleteMutation.mutate(selectedConversation.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          if (activeConversationId === selectedConversation.id) {
            onNewConversation();
          }
        },
      });
    }
  };

  const handleArchive = () => {
    if (selectedConversation) {
      archiveMutation.mutate(selectedConversation.id);
    }
    handleMenuClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <SidebarContainer
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Conversations
        </Typography>
        <Tooltip title="New conversation">
          <IconButton
            onClick={onNewConversation}
            size="small"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Conversation List */}
      <List sx={{ flex: 1, overflow: 'auto', py: 0 }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ px: 2, py: 1.5 }}>
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton variant="text" width="50%" height={16} />
            </Box>
          ))
        ) : conversations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <ChatIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No conversations yet
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Click + to start a new chat
            </Typography>
          </Box>
        ) : (
          conversations.map((conversation) => (
            <ListItemButton
              key={conversation.id}
              selected={activeConversationId === conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SparkleIcon
                  fontSize="small"
                  sx={{
                    color:
                      activeConversationId === conversation.id
                        ? theme.palette.primary.main
                        : theme.palette.text.secondary,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    fontWeight={activeConversationId === conversation.id ? 600 : 400}
                    noWrap
                  >
                    {conversation.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {conversation.messageCount ?? 0} messages · {formatDate(conversation.updatedAt)}
                  </Typography>
                }
              />
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, conversation)}
                sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            </ListItemButton>
          ))
        )}
      </List>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleRename}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem onClick={handleArchive}>
          <ListItemIcon>
            {selectedConversation?.isArchived ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
          </ListItemIcon>
          {selectedConversation?.isArchived ? 'Unarchive' : 'Archive'}
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: theme.palette.error.main }}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: 'inherit' }} /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rename Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
            placeholder="Enter conversation title"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRenameSubmit} variant="contained" disabled={!renameValue.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Conversation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedConversation?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </SidebarContainer>
  );
}

// ── Message Bubble ──────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessageDTO;
  isLatest: boolean;
}

function MessageBubbleComponent({ message, isLatest }: MessageBubbleProps) {
  const theme = useTheme();
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
        gap: 1.5,
        alignItems: 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: 2,
      }}
    >
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: isUser ? theme.palette.primary.main : theme.palette.secondary.main,
          fontSize: 14,
        }}
      >
        {isUser ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
      </Avatar>

      <Box sx={{ maxWidth: '75%', minWidth: 60 }}>
        <MessageBubble
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: isUser
              ? theme.palette.primary.main
              : alpha(theme.palette.grey[500], 0.06),
            color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
            border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
            position: 'relative',
          }}
        >
          {isUser ? (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {message.content}
            </Typography>
          ) : (
            <Box
              sx={{
                '& p': { my: 0.5 },
                '& p:first-of-type': { mt: 0 },
                '& p:last-of-type': { mb: 0 },
                '& pre': {
                  bgcolor: theme.palette.background.default,
                  p: 1.5,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.85em',
                  border: `1px solid ${theme.palette.divider}`,
                },
                '& code': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  px: 0.5,
                  borderRadius: 0.5,
                  fontSize: '0.9em',
                },
                '& pre code': {
                  bgcolor: 'transparent',
                  px: 0,
                },
                '& table': {
                  width: '100%',
                  borderCollapse: 'collapse',
                  my: 1,
                },
                '& th, & td': {
                  border: `1px solid ${theme.palette.divider}`,
                  px: 1,
                  py: 0.5,
                  textAlign: 'left',
                  fontSize: '0.85em',
                },
                '& th': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  fontWeight: 600,
                },
                '& ul, & ol': {
                  pl: 2,
                  my: 0.5,
                },
                '& li': {
                  mb: 0.25,
                },
                '& h1, & h2, & h3, & h4': {
                  mt: 1.5,
                  mb: 0.5,
                  fontWeight: 600,
                },
                '& hr': {
                  border: 'none',
                  borderTop: `1px solid ${theme.palette.divider}`,
                  my: 1,
                },
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </Box>
          )}
        </MessageBubble>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 0.5,
            justifyContent: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          {!isUser && isLatest && (
            <IconButton size="small" onClick={handleCopy} sx={{ ml: 0.5 }}>
              {copied ? (
                <CheckIcon sx={{ fontSize: 12, color: 'success.main' }} />
              ) : (
                <CopyIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              )}
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ── Typing Indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 2 }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: theme.palette.secondary.main,
          fontSize: 14,
        }}
      >
        <BotIcon fontSize="small" />
      </Avatar>
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.grey[500], 0.06),
          border: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <CircularProgress size={14} />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
          Thinking...
        </Typography>
      </Paper>
    </Box>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onNewConversation }: { onNewConversation: () => void }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SparkleIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
      </Box>
      <Typography variant="h5" fontWeight={700}>
        Vestara AI Assistant
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ maxWidth: 400 }}>
        Your intelligent admin assistant. Ask questions about the dashboard,
        get help with user management, or explore system settings.
      </Typography>
      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={onNewConversation}
        sx={{ mt: 2 }}
      >
        Start a Conversation
      </Button>
      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['How do I manage users?', 'Explain the dashboard', 'Security best practices'].map((suggestion) => (
          <Chip
            key={suggestion}
            label={suggestion}
            variant="outlined"
            size="small"
            onClick={() => {
              onNewConversation();
              // Auto-send the suggestion as first message after a short delay
              setTimeout(() => {
                const input = document.querySelector('[data-chat-input]') as HTMLInputElement;
                if (input) {
                  input.value = suggestion;
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }, 100);
            }}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

// ── Main ChatPage ───────────────────────────────────────────────────────────

export function ChatPage() {
  const theme = useTheme();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: conversationsData, isLoading: conversationsLoading } = useConversations();
  const conversations = conversationsData?.conversations ?? [];
  const { data: conversationData } = useConversation(activeConversationId ?? '');
  const { data: messagesData, isLoading: messagesLoading } = useChatMessages(activeConversationId ?? '', {
    perPage: 100,
  });
  const messages = messagesData?.messages ?? [];

  // Mutations
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();

  const isSending = sendMessage.isPending;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConversationId]);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setInputValue('');
    inputRef.current?.focus();
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setInputValue('');
  }, []);

  const handleSend = useCallback(async () => {
    const content = inputValue.trim();
    if (!content || isSending) return;

    setInputValue('');

    if (!activeConversationId) {
      // Create a new conversation with the first message
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
      // Send message in existing conversation
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
    <ChatContainer
      sx={{
        display: 'flex',
        height: 'calc(100vh - 120px)',
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
      }}
    >
      {/* Sidebar */}
      <ConversationSidebar
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        conversations={conversations}
        loading={conversationsLoading}
      />

      {/* Main Chat Area */}
      <MessageContainer
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {!activeConversationId ? (
          <EmptyState onNewConversation={handleNewConversation} />
        ) : (
          <>
            {/* Chat Header */}
            <Box
              sx={{
                px: 3,
                py: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <SparkleIcon sx={{ color: theme.palette.primary.main }} />
              <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ flex: 1 }}>
                {conversationData?.title ?? 'Loading...'}
              </Typography>
              <Chip
                label={conversationData?.model ?? 'AI'}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ height: 24 }}
              />
            </Box>

            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                px: 3,
                py: 2,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {messagesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="rounded" width="60%" height={40} sx={{ borderRadius: 2 }} />
                  </Box>
                ))
              ) : (
                messages.map((message, index) => (
                  <MessageBubbleComponent
                    key={message.id}
                    message={message}
                    isLatest={index === messages.length - 1}
                  />
                ))
              )}
              {isSending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box
              sx={{
                p: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
              }}
            >
              <TextField
                inputRef={inputRef}
                data-chat-input
                fullWidth
                multiline
                maxRows={4}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SparkleIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {isSending ? (
                        <CircularProgress size={20} />
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
                            '&:hover': {
                              bgcolor: inputValue.trim()
                                ? theme.palette.primary.dark
                                : undefined,
                            },
                          }}
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: theme.palette.background.default,
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
                AI responses are generated by {conversationData?.model ?? 'the selected model'}. Responses may not always be accurate.
              </Typography>
            </Box>
          </>
        )}
      </MessageContainer>
    </ChatContainer>
  );
}

export default ChatPage;
