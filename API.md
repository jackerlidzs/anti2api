# API Documentation

This document describes how to use the OpenAI-compatible API provided by Antigravity2API.

## Basic Configuration

All API requests need to carry the API Key in the Header:

```
Authorization: Bearer YOUR_API_KEY
```

Default service address: `http://localhost:8045`

## Table of Contents

- [Get Model List](#get-model-list)
- [Chat Completions](#chat-completions)
- [Tool Calling](#tool-calling-function-calling)
- [Image Input](#image-input-multimodal)
- [Image Generation](#image-generation)
- [Chain of Thought Models](#chain-of-thought-models)
- [SD WebUI Compatible API](#sd-webui-compatible-api)
- [Management API](#management-api)
- [Usage Examples](#usage-examples)

## Get Model List

```bash
curl http://localhost:8045/v1/models \
  -H "Authorization: Bearer sk-text"
```

**Note**: Model list is cached for 1 hour (configurable via `cache.modelListTTL` in `config.json`) to reduce API requests.

## Chat Completions

### Streaming Response

```bash
curl http://localhost:8045/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-text" \
  -d '{
    "model": "gemini-2.0-flash-exp",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

### Non-streaming Response

```bash
curl http://localhost:8045/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-text" \
  -d '{
    "model": "gemini-2.0-flash-exp",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

## Tool Calling (Function Calling)

```bash
curl http://localhost:8045/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-text" \
  -d '{
    "model": "gemini-2.0-flash-exp",
    "messages": [{"role": "user", "content": "How is the weather in Beijing?"}],
    "tools": [{
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather information",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {"type": "string", "description": "City name"}
          },
          "required": ["location"]
        }
      }
    }]
  }'
```

## Image Input (Multimodal)

Supports Base64 encoded image input, compatible with OpenAI multimodal format:

```bash
curl http://localhost:8045/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-text" \
  -d '{
    "model": "gemini-2.0-flash-exp",
    "messages": [{
      "role": "user",
      "content": [
        {"type": "text", "text": "What is in this image?"},
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
          }
        }
      ]
    }],
    "stream": true
  }'
```

### Supported Image Formats

- JPEG/JPG (`data:image/jpeg;base64,...`)
- PNG (`data:image/png;base64,...`)
- GIF (`data:image/gif;base64,...`)
- WebP (`data:image/webp;base64,...`)

## Image Generation

Supports using `gemini-3-pro-image` model to generate images. Generated images are returned in Markdown format:

```bash
curl http://localhost:8045/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-text" \
  -d '{
    "model": "gemini-3-pro-image",
    "messages": [{"role": "user", "content": "Draw a cute cat"}],
    "stream": false
  }'
```

**Response Example**:
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "![image](http://localhost:8045/images/abc123.png)"
    }
  }]
}
```

**Note**:
- Generated images are saved to `public/images/` directory.
- `IMAGE_BASE_URL` environment variable must be configured to return correct image URLs.

## Request Parameters

| Parameter | Type | Required | Description |
|------|------|------|------|
| `model` | string | ✅ | Model Name |
| `messages` | array | ✅ | Message List |
| `stream` | boolean | ❌ | Streaming Response, default false |
| `temperature` | number | ❌ | Temperature, default 1 |
| `top_p` | number | ❌ | Top P, default 1 |
| `top_k` | number | ❌ | Top K, default 50 |
| `max_tokens` | number | ❌ | Max tokens, default 32000 |
| `thinking_budget` | number | ❌ | Thinking Budget (Only for thinking models), can be 0 or 1024-32000, default 1024 (0 means disable thinking budget limit) |
| `reasoning_effort` | string | ❌ | Chain of Thought Effort (OpenAI format), values: `low`(1024), `medium`(16000), `high`(32000) |
| `tools` | array | ❌ | Tool List (Function Calling) |

## Response Format

### Non-streaming Response

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gemini-2.0-flash-exp",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

### Streaming Response

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1234567890,"model":"gemini-2.0-flash-exp","choices":[{"index":0,"delta":{"role":"assistant","content":"Hel"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1234567890,"model":"gemini-2.0-flash-exp","choices":[{"index":0,"delta":{"content":"lo"},"finish_reason":null}]}

data: [DONE]
```

## Error Handling

API returns standard HTTP status codes:

| Status Code | Description |
|--------|------|
| 200 | Success |
| 400 | Invalid Request Parameters |
| 401 | Invalid API Key |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

Error Response Format:

```json
{
  "error": {
    "message": "Error message",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

## Chain of Thought Models

For models supporting Chain of Thought (like `gemini-2.5-pro`, `claude-opus-4-5-thinking`, etc.), you can control reasoning depth via the following parameters:

### Using reasoning_effort (OpenAI Compatible)

```bash
curl http://localhost:8045/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-text" \
  -d '{
    "model": "gemini-2.5-pro",
    "messages": [{"role": "user", "content": "Explain quantum entanglement"}],
    "stream": true,
    "reasoning_effort": "high"
  }'
```

| reasoning_effort | thinking_budget | Description |
|-----------------|-----------------|------|
| `low` | 1024 | Fast response, suitable for simple questions (Default) |
| `medium` | 16000 | Balanced mode |
| `high` | 32000 | Deep thinking, suitable for complex reasoning |

### Using thinking_budget (Direct Value)

```bash
curl http://localhost:8045/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-text" \
  -d '{
    "model": "gemini-2.5-pro",
    "messages": [{"role": "user", "content": "Prove Pythagorean theorem"}],
      "stream": true,
    "thinking_budget": 24000
  }'
```

### 429 Auto-Retry Configuration

All 429 retry counts are controlled solely by server-side configuration:

- Global Default Retry Count (Server Config):
  - File: `config.json` -> `other.retryTimes`
  - Example:
    ```json
    "other": {
      "timeout": 300000,
      "retryTimes": 3,
      "skipProjectIdFetch": false,
      "useNativeAxios": false
    }
    ```
  - The server always uses the value configured here as the retry count for 429 errors (default 3 times).

### Chain of Thought Response Format

Chain of Thought content is output via `reasoning_content` field (DeepSeek format compatible):

**Non-streaming Response**:
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "reasoning_content": "Let me think about this...",
      "content": "Quantum entanglement is..."
    }
  }]
}
```

**Streaming Response**:
```
data: {"choices":[{"delta":{"reasoning_content":"Let me"}}]}
data: {"choices":[{"delta":{"reasoning_content":" think..."}}]}
data: {"choices":[{"delta":{"content":"Quantum entanglement is..."}}]}
```

### Models Supporting Chain of Thought

- `gemini-2.5-pro`
- `gemini-2.5-flash-thinking`
- `gemini-3-pro-high`
- `gemini-3-pro-low`
- `claude-opus-4-5-thinking`
- `claude-sonnet-4-5-thinking`
- `rev19-uic3-1p`
- `gpt-oss-120b-medium`

## SD WebUI Compatible API

This service provides Stable Diffusion WebUI compatible API endpoints for integration with clients supporting SD WebUI API.

### Text to Image

```bash
curl http://localhost:8045/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a cute cat, high quality, detailed",
    "negative_prompt": "",
    "steps": 20,
    "width": 512,
    "height": 512
  }'
```

### Image to Image

```bash
curl http://localhost:8045/sdapi/v1/img2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "enhance this image, high quality",
    "init_images": ["BASE64_ENCODED_IMAGE"],
    "steps": 20
  }'
```

### Other SD API Endpoints

| Endpoint | Description |
|------|------|
| `GET /sdapi/v1/sd-models` | Get available image generation models |
| `GET /sdapi/v1/options` | Get current options |
| `GET /sdapi/v1/samplers` | Get available samplers |
| `GET /sdapi/v1/upscalers` | Get available upscalers |
| `GET /sdapi/v1/progress` | Get generation progress |

## Management API

Management API requires JWT authentication. First get token via login interface.

### Login

```bash
curl http://localhost:8045/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Token Management

```bash
# Get Token List
curl http://localhost:8045/admin/tokens \
  -H "Authorization: Bearer JWT_TOKEN"

# Add Token
curl http://localhost:8045/admin/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "access_token": "ya29.xxx",
    "refresh_token": "1//xxx",
    "expires_in": 3599
  }'

# Delete Token
curl -X DELETE http://localhost:8045/admin/tokens/REFRESH_TOKEN \
  -H "Authorization: Bearer JWT_TOKEN"
```

### View Model Quota

```bash
# Get quota for specific Token
curl http://localhost:8045/admin/tokens/REFRESH_TOKEN/quotas \
  -H "Authorization: Bearer JWT_TOKEN"

# Force refresh quota data
curl "http://localhost:8045/admin/tokens/REFRESH_TOKEN/quotas?refresh=true" \
  -H "Authorization: Bearer JWT_TOKEN"
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "lastUpdated": 1702700000000,
    "models": {
      "gemini-2.5-pro": {
        "remaining": 0.85,
        "resetTime": "12-16 20:00",
        "resetTimeRaw": "2024-12-16T12:00:00Z"
      }
    }
  }
}
```

### Rotation Strategy Configuration

```bash
# Get current rotation config
curl http://localhost:8045/admin/rotation \
  -H "Authorization: Bearer JWT_TOKEN"

# Update rotation strategy
curl -X PUT http://localhost:8045/admin/rotation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "strategy": "request_count",
    "requestCount": 20
  }'
```

**Available Strategies**:
- `round_robin`: Switch Token after every request
- `quota_exhausted`: Switch only when quota exhausted
- `request_count`: Switch after custom request count

### Configuration Management

```bash
# Get Config
curl http://localhost:8045/admin/config \
  -H "Authorization: Bearer JWT_TOKEN"

# Update Config
curl -X PUT http://localhost:8045/admin/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "json": {
      "defaults": {
        "temperature": 0.7
      }
    }
  }'
```

## Usage Examples

### Python

```python
import openai

openai.api_base = "http://localhost:8045/v1"
openai.api_key = "sk-text"

response = openai.ChatCompletion.create(
    model="gemini-2.0-flash-exp",
    messages=[{"role": "user", "content": "Hello"}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.get("content", ""), end="")
```

### Node.js

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:8045/v1',
  apiKey: 'sk-text'
});

const stream = await openai.chat.completions.create({
  model: 'gemini-2.0-flash-exp',
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

## Configuration Options

### passSignatureToClient

Controls whether to pass `thoughtSignature` to client response.

Configure in `config.json`:

```json
{
  "other": {
    "passSignatureToClient": false
  }
}
```

- `false` (Default): Do not pass signature, response excludes `thoughtSignature` field.
- `true`: Pass signature, response includes `thoughtSignature` field.

**Response Example with Pass-through Enabled**:

```json
{
  "choices": [{
    "delta": {
      "reasoning_content": "Let me think...",
      "thoughtSignature": "RXFRRENrZ0lDaEFD..."
    }
  }]
}
```

### useContextSystemPrompt

Controls whether to merge system messages in request to SystemInstruction.

```json
{
  "other": {
    "useContextSystemPrompt": false
  }
}
```

- `false` (Default): Use only global `SYSTEM_INSTRUCTION` environment variable.
- `true`: Merge consecutive system messages at start of request with global configuration.

## Notes

1. All `/v1/*` requests must carry a valid API Key.
2. Management API (`/admin/*`) requires JWT authentication.
3. Image input requires Base64 encoding.
4. Streaming response uses Server-Sent Events (SSE) format, includes heartbeat mechanism to prevent timeouts.
5. Tool calling requires model support for Function Calling.
6. Image generation only supports `gemini-3-pro-image` model.
7. Model list is cached for 1 hour, adjustable via config.
8. Chain of Thought content is output via `reasoning_content` field (DeepSeek format compatible).
9. Default rotation strategy is `request_count`, switching Token every 50 requests.
