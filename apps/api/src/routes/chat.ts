import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { chatService } from '../services/index.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

/**
 * GET /chat/models — List available AI models
 */
router.get('/models', async (_req, res, next) => {
  try {
    const models = chatService.getAvailableModels();
    sendSuccess(res, { models });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /chat/conversations — List user's conversations
 */
router.get('/conversations', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const perPage = Math.min(Number(req.query.perPage) || 20, 100);
    const search = req.query.search as string | undefined;
    const isArchived = req.query.isArchived === 'true' ? true : undefined;

    const result = await chatService.listConversations(
      req.user!.id,
      req.user!.organizationId,
      { page, perPage, search, isArchived },
    );

    sendSuccess(res, {
      conversations: result.conversations,
      pagination: {
        page,
        perPage,
        total: result.total,
        totalPages: Math.ceil(result.total / perPage),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /chat/conversations — Create a new conversation
 */
router.post('/conversations', async (req, res, next) => {
  try {
    const { title, model, systemPrompt, firstMessage } = req.body as {
      title?: string;
      model?: string;
      systemPrompt?: string;
      firstMessage?: string;
    };

    const conversation = await chatService.createConversation(
      req.user!.id,
      req.user!.organizationId,
      {
        title: title ?? 'New Conversation',
        model,
        systemPrompt,
        firstMessage,
      },
    );

    sendCreated(res, { conversation });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /chat/conversations/:id — Get a conversation with messages
 */
router.get('/conversations/:id', async (req, res, next) => {
  try {
    const conversation = await chatService.getConversation(
      req.params.id,
      req.user!.id,
      req.user!.organizationId,
    );
    sendSuccess(res, { conversation });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /chat/conversations/:id — Rename a conversation
 */
router.put('/conversations/:id', async (req, res, next) => {
  try {
    const { title } = req.body as { title?: string };
    await chatService.renameConversation(
      req.params.id,
      req.user!.id,
      req.user!.organizationId,
      title ?? '',
    );
    sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /chat/conversations/:id/archive — Toggle archive status
 */
router.patch('/conversations/:id/archive', async (req, res, next) => {
  try {
    const result = await chatService.toggleArchive(
      req.params.id,
      req.user!.id,
      req.user!.organizationId,
    );
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /chat/conversations/:id — Delete a conversation
 */
router.delete('/conversations/:id', async (req, res, next) => {
  try {
    await chatService.deleteConversation(
      req.params.id,
      req.user!.id,
      req.user!.organizationId,
    );
    sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /chat/conversations/:id/messages — List messages in a conversation
 */
router.get('/conversations/:id/messages', async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const perPage = Math.min(Number(req.query.perPage) || 50, 100);

    const result = await chatService.listMessages(
      req.params.id,
      req.user!.id,
      req.user!.organizationId,
      { page, perPage },
    );

    sendSuccess(res, {
      messages: result.messages,
      pagination: {
        page,
        perPage,
        total: result.total,
        totalPages: Math.ceil(result.total / perPage),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /chat/conversations/:id/messages — Send a message and get AI response
 */
router.post('/conversations/:id/messages', async (req, res, next) => {
  try {
    const { content, model } = req.body as {
      content?: string;
      model?: string;
    };

    if (!content || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Message content is required' },
      });
      return;
    }

    const result = await chatService.sendMessage(
      req.params.id,
      req.user!.id,
      req.user!.organizationId,
      { content: content.trim(), model },
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /chat/stats — Get chat statistics
 */
router.get('/stats', async (_req, res, next) => {
  try {
    const stats = await chatService.getStats(_req.user!.organizationId);
    sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
});

export default router;
