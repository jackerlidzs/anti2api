/**
 * OpenAI API Routes
 * Handle /v1/chat/completions, /v1/responses, and /v1/models endpoints
 */

import { Router } from 'express';
import { getAvailableModels } from '../api/client.js';
import { handleOpenAIRequest } from '../server/handlers/openai.js';
import { handleResponsesRequest } from '../server/handlers/responses.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * Normalize message content - flatten nested text structures
 */
function normalizeContent(content) {
  if (typeof content === 'string') return content;
  if (content == null) return '';

  if (Array.isArray(content)) {
    const texts = [];
    for (const item of content) {
      if (typeof item === 'string') {
        texts.push(item);
      } else if (item && typeof item === 'object') {
        let textValue = item.text;
        while (typeof textValue === 'object' && textValue !== null) {
          textValue = textValue.text;
        }
        if (typeof textValue === 'string') {
          texts.push(textValue);
        }
      }
    }
    return texts.join('');
  }

  if (typeof content === 'object') {
    let textValue = content.text;
    while (typeof textValue === 'object' && textValue !== null) {
      textValue = textValue.text;
    }
    if (typeof textValue === 'string') return textValue;
  }

  return String(content);
}

/**
 * Normalize messages array
 */
function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return messages;
  return messages.map(msg => ({
    ...msg,
    content: normalizeContent(msg.content)
  }));
}

/**
 * GET /v1/models
 */
router.get('/models', async (req, res) => {
  try {
    const models = await getAvailableModels();
    res.json(models);
  } catch (error) {
    logger.error('Failed to get model list:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/chat/completions
 */
router.post('/chat/completions', (req, res) => {
  if (req.body.messages) {
    req.body.messages = normalizeMessages(req.body.messages);
  }
  return handleOpenAIRequest(req, res);
});

/**
 * POST /v1/responses
 * Handle OpenAI Responses API format (used by Droid)
 */
router.post('/responses', (req, res) => {
  const body = req.body;

  // If already has messages, normalize and pass to responses handler
  if (body.messages) {
    req.body.messages = normalizeMessages(body.messages);
    delete req.body.tools;
    return handleResponsesRequest(req, res);
  }

  // Convert 'input' to 'messages'
  if (body.input) {
    let messages = [];

    if (body.instructions) {
      messages.push({ role: 'system', content: body.instructions });
    }

    const input = body.input;
    if (typeof input === 'string') {
      messages.push({ role: 'user', content: input });
    } else if (Array.isArray(input)) {
      for (const item of input) {
        if (typeof item === 'string') {
          messages.push({ role: 'user', content: item });
        } else if (item.role) {
          messages.push({ role: item.role, content: normalizeContent(item.content) || '' });
        }
      }
    }

    req.body = {
      ...body,
      messages: normalizeMessages(messages),
      stream: body.stream ?? false
    };
    delete req.body.input;
    delete req.body.instructions;
    delete req.body.tools;
  }

  return handleResponsesRequest(req, res);
});

export default router;