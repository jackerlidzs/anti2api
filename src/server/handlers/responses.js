/**
 * OpenAI Responses API Handler
 * Handle /v1/responses requests with proper Responses API format
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
    writeStreamData,
    endStream,
    with429Retry
} from '../stream.js';

/**
 * Generate unique ID for responses
 */
function generateResponseId() {
    return `resp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Convert Chat Completions response to Responses API format
 */
function toResponsesFormat(content, model, usage) {
    const responseId = generateResponseId();
    const messageId = generateMessageId();

    return {
        id: responseId,
        object: 'response',
        created_at: Math.floor(Date.now() / 1000),
        model: model,
        output: [
            {
                type: 'message',
                id: messageId,
                status: 'completed',
                role: 'assistant',
                content: [
                    {
                        type: 'output_text',
                        text: content || ''
                    }
                ]
            }
        ],
        usage: usage || {
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0
        },
        status: 'completed'
    };
}

/**
 * Create Responses API stream event
 */
function createResponsesStreamEvent(eventType, data) {
    return {
        type: eventType,
        ...data
    };
}

/**
 * Handle Responses API request
 */
export const handleResponsesRequest = async (req, res) => {
    const { messages, model, stream = false, ...params } = req.body;

    try {
        if (!messages) {
            return res.status(400).json({
                type: 'error',
                error: {
                    type: 'invalid_request_error',
                    message: 'messages is required'
                }
            });
        }

        const token = await tokenManager.getToken();
        if (!token) {
            throw new Error('No available token');
        }

        const requestBody = generateRequestBody(messages, model, params, null, token);
        const { id, created } = createResponseMeta();
        const maxRetries = Number(config.retryTimes || 0);
        const safeRetries = maxRetries > 0 ? Math.floor(maxRetries) : 0;

        const responseId = generateResponseId();
        const messageId = generateMessageId();

        if (stream) {
            setStreamHeaders(res);
            const heartbeatTimer = createHeartbeat(res);

            try {
                let fullContent = '';
                let usageData = null;

                // Send response.created event
                writeStreamData(res, createResponsesStreamEvent('response.created', {
                    response: {
                        id: responseId,
                        object: 'response',
                        status: 'in_progress',
                        model: model
                    }
                }));

                // Send output_item.added event
                writeStreamData(res, createResponsesStreamEvent('response.output_item.added', {
                    output_index: 0,
                    item: {
                        type: 'message',
                        id: messageId,
                        role: 'assistant',
                        status: 'in_progress',
                        content: []
                    }
                }));

                // Send content_part.added event
                writeStreamData(res, createResponsesStreamEvent('response.content_part.added', {
                    output_index: 0,
                    content_index: 0,
                    part: {
                        type: 'output_text',
                        text: ''
                    }
                }));

                await with429Retry(
                    () => generateAssistantResponse(requestBody, token, (data) => {
                        if (data.type === 'usage') {
                            usageData = data.usage;
                        } else if (data.content) {
                            fullContent += data.content;
                            // Send text delta event
                            writeStreamData(res, createResponsesStreamEvent('response.output_text.delta', {
                                output_index: 0,
                                content_index: 0,
                                delta: data.content
                            }));
                        }
                    }),
                    safeRetries,
                    'responses.stream '
                );

                // Send text done event
                writeStreamData(res, createResponsesStreamEvent('response.output_text.done', {
                    output_index: 0,
                    content_index: 0,
                    text: fullContent
                }));

                // Send content_part.done event
                writeStreamData(res, createResponsesStreamEvent('response.content_part.done', {
                    output_index: 0,
                    content_index: 0,
                    part: {
                        type: 'output_text',
                        text: fullContent
                    }
                }));

                // Send output_item.done event
                writeStreamData(res, createResponsesStreamEvent('response.output_item.done', {
                    output_index: 0,
                    item: {
                        type: 'message',
                        id: messageId,
                        role: 'assistant',
                        status: 'completed',
                        content: [
                            {
                                type: 'output_text',
                                text: fullContent
                            }
                        ]
                    }
                }));

                // Send response.done event
                writeStreamData(res, createResponsesStreamEvent('response.done', {
                    response: toResponsesFormat(fullContent, model, usageData)
                }));

                clearInterval(heartbeatTimer);
                endStream(res);
            } catch (error) {
                clearInterval(heartbeatTimer);
                throw error;
            }
        } else {
            // Non-streaming request
            req.setTimeout(0);
            res.setTimeout(0);

            const { content, usage } = await with429Retry(
                () => generateAssistantResponseNoStream(requestBody, token),
                safeRetries,
                'responses.no_stream '
            );

            res.json(toResponsesFormat(content, model, usage));
        }
    } catch (error) {
        logger.error('Responses API error:', error.message);
        if (res.headersSent) return;
        const statusCode = error.statusCode || error.status || 500;
        return res.status(statusCode).json({
            type: 'error',
            error: {
                type: 'api_error',
                message: error.message
            }
        });
    }
};
