/**
 * OpenAI Format Handler
 * Handle /v1/chat/completions request, support streaming and non-streaming response
 */

import { generateAssistantResponse, generateAssistantResponseNoStream } from '../../api/client.js';
import { generateRequestBody, prepareImageRequest } from '../../utils/utils.js';
import { buildOpenAIErrorPayload } from '../../utils/errors.js';
import logger from '../../utils/logger.js';
import config from '../../config/config.js';
import tokenManager from '../../auth/token_manager.js';
import {
  createResponseMeta,
  setStreamHeaders,
  createHeartbeat,
  getChunkObject,
  releaseChunkObject,
  writeStreamData,
  endStream,
  with429Retry
} from '../stream.js';

/**
 * Create stream chunk
 * Support DeepSeek format reasoning_content
 * @param {string} id - Response ID
 * @param {number} created - Creation timestamp
 * @param {string} model - Model name
 * @param {Object} delta - Delta content
 * @param {string|null} finish_reason - Finish reason
 * @returns {Object}
 */
export const createStreamChunk = (id, created, model, delta, finish_reason = null) => {
  const chunk = getChunkObject();
  chunk.id = id;
  chunk.object = 'chat.completion.chunk';
  chunk.created = created;
  chunk.model = model;
  chunk.choices[0].delta = delta;
  chunk.choices[0].finish_reason = finish_reason;
  return chunk;
};

/**
 * Handle OpenAI format chat request
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const handleOpenAIRequest = async (req, res) => {
  const { messages, model, stream = false, tools, ...params } = req.body;

  try {
    if (!messages) {
      return res.status(400).json({ error: 'messages is required' });
    }

    const token = await tokenManager.getToken();
    if (!token) {
      throw new Error('No available token, please run npm run login to get token');
    }

    const isImageModel = model.includes('-image');
    const requestBody = generateRequestBody(messages, model, params, tools, token);

    if (isImageModel) {
      prepareImageRequest(requestBody);
    }

    const { id, created } = createResponseMeta();
    const maxRetries = Number(config.retryTimes || 0);
    const safeRetries = maxRetries > 0 ? Math.floor(maxRetries) : 0;

    if (stream) {
      setStreamHeaders(res);

      // Start heartbeat to prevent Cloudflare timeout disconnection
      const heartbeatTimer = createHeartbeat(res);

      try {
        if (isImageModel) {
          const { content, usage } = await with429Retry(
            () => generateAssistantResponseNoStream(requestBody, token),
            safeRetries,
            'chat.stream.image '
          );
          writeStreamData(res, createStreamChunk(id, created, model, { content }));
          writeStreamData(res, { ...createStreamChunk(id, created, model, {}, 'stop'), usage });
        } else {
          let hasToolCall = false;
          let usageData = null;

          await with429Retry(
            () => generateAssistantResponse(requestBody, token, (data) => {
              if (data.type === 'usage') {
                usageData = data.usage;
              } else if (data.type === 'reasoning') {
                const delta = { reasoning_content: data.reasoning_content };
                if (data.thoughtSignature && config.passSignatureToClient) {
                  delta.thoughtSignature = data.thoughtSignature;
                }
                writeStreamData(res, createStreamChunk(id, created, model, delta));
              } else if (data.type === 'tool_calls') {
                hasToolCall = true;
                // Decide whether to pass the signature in tool calls based on configuration
                const toolCallsWithIndex = data.tool_calls.map((toolCall, index) => {
                  if (config.passSignatureToClient) {
                    return { index, ...toolCall };
                  } else {
                    const { thoughtSignature, ...rest } = toolCall;
                    return { index, ...rest };
                  }
                });
                const delta = { tool_calls: toolCallsWithIndex };
                writeStreamData(res, createStreamChunk(id, created, model, delta));
              } else {
                const delta = { content: data.content };
                writeStreamData(res, createStreamChunk(id, created, model, delta));
              }
            }),
            safeRetries,
            'chat.stream '
          );

          writeStreamData(res, { ...createStreamChunk(id, created, model, {}, hasToolCall ? 'tool_calls' : 'stop'), usage: usageData });
        }

        clearInterval(heartbeatTimer);
        endStream(res);
      } catch (error) {
        clearInterval(heartbeatTimer);
        throw error;
      }
    } else {
      // Non-streaming request: Set long timeout to avoid large model response timeout
      req.setTimeout(0); // Disable request timeout
      res.setTimeout(0); // Disable response timeout

      const { content, reasoningContent, reasoningSignature, toolCalls, usage } = await with429Retry(
        () => generateAssistantResponseNoStream(requestBody, token),
        safeRetries,
        'chat.no_stream '
      );

      // DeepSeek format: reasoning_content before content
      const message = { role: 'assistant' };
      if (reasoningContent) message.reasoning_content = reasoningContent;
      if (reasoningSignature && config.passSignatureToClient) message.thoughtSignature = reasoningSignature;
      message.content = content;

      if (toolCalls.length > 0) {
        // Decide whether to pass the signature in tool calls based on configuration
        if (config.passSignatureToClient) {
          message.tool_calls = toolCalls;
        } else {
          message.tool_calls = toolCalls.map(({ thoughtSignature, ...rest }) => rest);
        }
      }

      // Use pre-built response object to reduce memory allocation
      const response = {
        id,
        object: 'chat.completion',
        created,
        model,
        choices: [{
          index: 0,
          message,
          finish_reason: toolCalls.length > 0 ? 'tool_calls' : 'stop'
        }],
        usage
      };

      res.json(response);
    }
  } catch (error) {
    logger.error('Failed to generate response:', error.message);
    if (res.headersSent) return;
    const statusCode = error.statusCode || error.status || 500;
    return res.status(statusCode).json(buildOpenAIErrorPayload(error, statusCode));
  }
};