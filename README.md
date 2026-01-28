# Antigravity to OpenAI API Proxy Service

A proxy service that converts Google Antigravity API to OpenAI compatible format, supporting streaming responses, tool calling, and multi-account management.

## Features

- ✅ OpenAI API Compatible Format
- ✅ Streaming and Non-streaming Responses
- ✅ Tool Calling (Function Calling) Support
- ✅ Multi-account Automatic Rotation (Supports multiple rotation strategies)
- ✅ Token Automatic Refresh
- ✅ API Key Authentication
- ✅ Chain of Thought (Thinking) Output, compatible with OpenAI reasoning_effort parameter and DeepSeek reasoning_content format
- ✅ Image Input Support (Base64 encoding)
- ✅ Image Generation Support (gemini-3-pro-image model)
- ✅ Random ProjectId Support for Pro Accounts
- ✅ Model Quota Viewing (Real-time display of remaining quota and reset time)
- ✅ SD WebUI API Compatible (Supports txt2img/img2img)
- ✅ Heartbeat Mechanism (Prevent Cloudflare timeout disconnection)
- ✅ Model List Caching (Reduce API requests)
- ✅ Eligibility Verification Auto-fallback (Auto-generate random ProjectId when ineligible)
- ✅ True System Message Merging (Merge consecutive system messages at the beginning with SystemInstruction)
- ✅ Privacy Mode (Auto-hide sensitive information)
- ✅ Memory Optimization (Reduced from 8+ processes to 2, memory usage reduced from 100MB+ to 50MB+)
- ✅ Object Pool Reuse (Reduce 50%+ temporary object creation, lower GC frequency)
- ✅ Signature Pass-through Control (Configurable whether to pass thoughtSignature to client)
- ✅ Pre-compiled Binaries (Supports Windows/Linux/Android, no Node.js environment required)
- ✅ Multi-API Format Support (OpenAI, Gemini, Claude formats)
- ✅ Converter Code Reuse (Common module extraction, reduced duplicate code)
- ✅ Dynamic Memory Thresholds (Auto-calculate thresholds based on user configuration)

## Requirements

- Node.js >= 18.0.0

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and edit configuration:

```bash
cp .env.example .env
```

Edit `.env` file with necessary parameters:

```env
# Required Configuration
API_KEY=sk-text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-jwt-secret-key-change-this-in-production

# Optional Configuration
# PROXY=http://127.0.0.1:7890
# SYSTEM_INSTRUCTION=You are a chat bot
# IMAGE_BASE_URL=http://your-domain.com
```

### 3. Login to Get Token

```bash
npm run login
```

The browser will automatically open the Google authorization page. After authorization, the Token will be saved to `data/accounts.json`.

### 4. Start Service

```bash
npm start
```

The service will start at `http://localhost:8045`.

## Binary Deployment (Recommended)

No Node.js installation required, simply download the pre-compiled binary to run.

### Download Binary

Download the binary for your platform from [GitHub Releases](https://github.com/ZhaoShanGeng/antigravity2api-nodejs/releases):

| Platform | Filename |
|------|--------|
| Windows x64 | `antigravity2api-win-x64.exe` |
| Linux x64 | `antigravity2api-linux-x64` |
| Linux ARM64 | `antigravity2api-linux-arm64` |
| macOS x64 | `antigravity2api-macos-x64` |
| macOS ARM64 | `antigravity2api-macos-arm64` |

### Prepare Configuration Files

Place the following files in the same directory as the binary:

```
├── antigravity2api-win-x64.exe  # Binary file
├── .env                          # Environment variables (Required)
├── config.json                   # Basic config (Required)
├── public/                       # Static files directory (Required)
│   ├── index.html
│   ├── style.css
│   ├── assets/
│   │   └── bg.jpg
│   └── js/
│       ├── auth.js
│       ├── config.js
│       ├── main.js
│       ├── quota.js
│       ├── tokens.js
│       ├── ui.js
│       └── utils.js
└── data/                         # Data directory (Auto-created)
    └── accounts.json
```

### Configure Environment Variables

Create `.env` file:

```env
API_KEY=sk-your-api-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-jwt-secret-key-change-this-in-production
# IMAGE_BASE_URL=http://your-domain.com
# PROXY=http://127.0.0.1:7890
```

### Run

**Windows**:
```bash
# Double click to run, or execute in command line
antigravity2api-win-x64.exe
```

**Linux/macOS**:
```bash
# Add execution permission
chmod +x antigravity2api-linux-x64

# Run
./antigravity2api-linux-x64
```

### Binary Deployment Notes

- **No Node.js Required**: Binary includes Node.js runtime.
- **Config Files**: `.env` and `config.json` must be in the same directory as the binary.
- **Static Files**: `public/` directory must be in the same directory as the binary.
- **Data Persistence**: `data/` directory will be automatically created to store Token data.
- **Cross-platform**: Supports Windows, Linux, macOS (x64 and ARM64).

### Run as System Service (Linux)

Create systemd service file `/etc/systemd/system/antigravity2api.service`:

```ini
[Unit]
Description=Antigravity2API Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/antigravity2api
ExecStart=/opt/antigravity2api/antigravity2api-linux-x64
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable antigravity2api
sudo systemctl start antigravity2api
```

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Configure Environment Variables**

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` file with necessary parameters.

2. **Start Service**

```bash
docker-compose up -d
```

3. **View Logs**

```bash
docker-compose logs -f
```

4. **Stop Service**

```bash
docker-compose down
```

### Using Docker

1. **Build Image**

```bash
docker build -t antigravity2api .
```

2. **Run Container**

```bash
docker run -d \
  --name antigravity2api \
  -p 8045:8045 \
  -e API_KEY=sk-text \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  -e JWT_SECRET=your-jwt-secret-key \
  -e IMAGE_BASE_URL=http://your-domain.com \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/public/images:/app/public/images \
  -v $(pwd)/.env:/app/.env \
  -v $(pwd)/config.json:/app/config.json \
  antigravity2api
```

3. **View Logs**

```bash
docker logs -f antigravity2api
```

### Docker Deployment Notes

- Data Persistence: `data/` directory mounted to container for Token data.
- Image Storage: `public/images/` directory mounted to container for generated images.
- Configuration: `.env` and `config.json` mounted to container for hot reloading.
- Port Mapping: Default maps 8045 port, modify as needed.
- Auto Restart: Container auto-restarts on abnormal exit.

## Zeabur Deployment

### Deploy Using Pre-built Image

1. **Create Service**

Create new service in Zeabur console using image:

```
ghcr.io/liuw1535/antigravity2api-nodejs
```

2. **Configure Environment Variables**

Add the following environment variables in service settings:

| Variable | Description | Example |
|--------|------|--------|
| `API_KEY` | API Authentication Key | `sk-your-api-key` |
| `ADMIN_USERNAME` | Admin Username | `admin` |
| `ADMIN_PASSWORD` | Admin Password | `your-secure-password` |
| `JWT_SECRET` | JWT Secret | `your-jwt-secret-key` |
| `IMAGE_BASE_URL` | Image Service Base URL | `https://your-domain.zeabur.app` |

Optional Variables:
- `PROXY`: Proxy address
- `SYSTEM_INSTRUCTION`: System instruction

3. **Configure Persistent Storage**

Add the following mount points in "Volumes" settings:

| Mount Path | Description |
|---------|------|
| `/app/data` | Token Data Storage |
| `/app/public/images` | Generated Image Storage |

⚠️ **Important**:
- Only mount `/app/data` and `/app/public/images`.
- Do NOT mount other directories (like `/app/.env`, `/app/config.json`) or necessary config files may be wiped and service will fail to start.

4. **Bind Domain**

Bind a domain in "Networking" settings and set it to `IMAGE_BASE_URL` env variable.

5. **Start Service**

Save config, Zeabur will pull image and start service. Visits bound domain to use.

### Zeabur Deployment Notes

- Uses pre-built Docker image, no manual build required.
- Configured via environment variables.
- Persistent storage ensures Token and image data safety.

## Web Management Interface

After startup, visit `http://localhost:8045` to open Web Management Interface.

### Features

- 🔐 **Secure Login**: JWT Token authentication protecting admin interfaces.
- 📊 **Real-time Stats**: Total Tokens, enabled/disabled status stats.
- ➕ **Multiple Add Methods**:
  - OAuth Login (Recommended): Auto-complete Google authorization.
  - Manual Input: Directly input Access Token and Refresh Token.
- 🎯 **Token Management**:
  - View detailed Token info (Access Token suffix, Project ID, Expiry).
  - 📊 View model quotas: Grouped by type (Claude/Gemini/Other), real-time remaining quota and reset time.
  - One-click Enable/Disable Token.
  - Delete invalid Token.
  - Real-time Refresh Token list.
- ⚙️ **Configuration Management**:
  - Online edit server config (port, listener address).
  - Adjust default parameters (Temperature, Top P/K, Max Tokens).
  - Modify security config (API Key, Request Size Limit).
  - Configure proxy, system instruction options.
  - Hot reload config (Some configs require restart).

### Usage Flow

1. **Login**
   - Login with `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`.
   - JWT Token saved to browser upon success.

2. **Add Token**
   - **OAuth Method** (Recommended):
     1. Click "OAuth Login".
     2. Click "Open Auth Page" in popup.
     3. Complete Google authorization in new window.
     4. Copy full callback URL from address bar.
     5. Paste into input box and submit.
   - **Manual Method**:
     1. Click "Manual Input".
     2. Fill in Access Token, Refresh Token and Expiry.
     3. Submit to save.

3. **Manage Tokens**
   - View Token status and info cards.
   - Click "📊 View Quota" to check model quotas.
     - Auto-grouped by model type.
     - Display remaining percentage and progress bar.
     - Display reset time (Beijing Time).
     - Support "Refresh Now" for forced update.
   - Use "Enable/Disable" buttons to control Token status.
   - Use "Delete" button to remove invalid Token.
   - Click "Refresh" to update list.

4. **Privacy Mode**
   - Enabled by default, hides sensitive info like Token, Project ID.
   - Click "Show Sensitive Info" to toggle.
   - Supports individual or batch display.

5. **Configure Rotation Strategy**
   - Supports three strategies:
     - `round_robin`: Load balanced, switches Token after every request.
     - `quota_exhausted`: Switch only when quota exhausted.
     - `request_count`: Switch after custom request count.
   - Configurable in "Settings" page.

6. **Modify Configuration**
   - Switch to "Settings" tab.
   - Modify configs as needed.
   - Click "Save Config" to apply.
   - Note: Port and Host changes require restart.
   - Supported settings:
     - Edit Token Info (Access Token, Refresh Token).
     - Thinking Budget (1024-32000).
     - Image Access URL.
     - Rotation Strategy.
     - Memory Threshold.
     - Heartbeat Interval.
     - Font Size.

### Interface Preview

- **Token Management Page**: Card view for all Tokens, quick actions.
- **Settings Page**: Categorized configs, online editing.
- **Responsive Design**: Supports Desktop and Mobile.
- **Font Optimization**: Uses MiSans + Ubuntu Mono for readability.

## API Usage

Provides OpenAI compatible API interfaces. See [API.md](API.md) for details.

### Quick Test

```bash
curl http://localhost:8045/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-text" \
  -d '{
    "model": "gemini-2.0-flash-exp",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Multi-account Management

`data/accounts.json` supports multiple accounts, service automatically rotates:

```json
[
  {
    "access_token": "ya29.xxx",
    "refresh_token": "1//xxx",
    "expires_in": 3599,
    "timestamp": 1234567890000,
    "enable": true
  },
  {
    "access_token": "ya29.yyy",
    "refresh_token": "1//yyy",
    "expires_in": 3599,
    "timestamp": 1234567890000,
    "enable": true
  }
]
```

- `enable: false` to disable an account.
- Token automatically refreshes upon expiry.
- Refresh failure (403) automatically disables account and switches to next.

## Configuration Details

Project configuration has two parts:

### 1. config.json (Basic Config)

Basic configuration file containing server, API, and default settings:

```json
{
  "server": {
    "port": 8045,              // Server Port
    "host": "0.0.0.0",         // Listen Address
    "maxRequestSize": "500mb", // Max Request Body Size
    "heartbeatInterval": 15000,// Heartbeat Interval (ms), prevents Cloudflare timeout
    "memoryThreshold": 100     // Memory Threshold (MB), triggers GC on excess
  },
  "rotation": {
    "strategy": "round_robin", // Rotation Strategy: round_robin/quota_exhausted/request_count
    "requestCount": 50         // Requests per token for request_count strategy
  },
  "defaults": {
    "temperature": 1,          // Default Temperature
    "topP": 1,                 // Default top_p
    "topK": 50,                // Default top_k
    "maxTokens": 32000,        // Default max tokens
    "thinkingBudget": 1024     // Default Thinking Budget (Only for thinking models, range 1024-32000)
  },
  "cache": {
    "modelListTTL": 3600000    // Model List Cache TTL (ms), default 1 hour
  },
  "other": {
    "timeout": 300000,         // Request Timeout (ms)
    "skipProjectIdFetch": false,// Skip ProjectId fetch, use random (Pro accounts only)
    "useNativeAxios": false,   // Use native axios instead of AntigravityRequester
    "useContextSystemPrompt": false, // Merge system messages in request to SystemInstruction
    "passSignatureToClient": false   // Pass thoughtSignature to client
  }
}
```

### Rotation Strategies

| Strategy | Description |
|------|------|
| `round_robin` | Load Balance: Switch to next Token after every request |
| `quota_exhausted` | Exhaust Quota: Continue using current Token until quota exhausted (Performance optimized) |
| `request_count` | Custom Count: Switch after specified number of requests (Default) |

### 2. .env (Sensitive Config)

Environment variable file containing sensitive and optional configs:

| Variable | Description | Required |
|--------|------|------|
| `API_KEY` | API Authentication Key | ✅ |
| `ADMIN_USERNAME` | Admin Username | ✅ |
| `ADMIN_PASSWORD` | Admin Password | ✅ |
| `JWT_SECRET` | JWT Secret | ✅ |
| `PROXY` | Proxy Address (e.g. http://127.0.0.1:7890), also supports system proxy vars `HTTP_PROXY`/`HTTPS_PROXY` | ❌ |
| `SYSTEM_INSTRUCTION` | System Instruction | ❌ |
| `IMAGE_BASE_URL` | Image Service Base URL | ❌ |

Refer to `.env.example` for full example.

## Development Commands

```bash
# Start Service
npm start

# Development Mode (Auto Restart)
npm run dev

# Login to Get Token
npm run login
```

## Project Structure

```
.
├── data/
│   ├── accounts.json       # Token Storage (Auto-generated)
│   └── quotas.json         # Quota Cache (Auto-generated)
├── public/
│   ├── index.html          # Web Interface
│   ├── app.js              # Frontend Logic
│   ├── style.css           # Styles
│   └── images/             # Generated Images
├── scripts/
│   ├── oauth-server.js     # OAuth Login Service
│   └── refresh-tokens.js   # Token Refresh Script
├── src/
│   ├── api/
│   │   ├── client.js       # API Client (Model Cache)
│   │   └── stream_parser.js # Stream Parser (Object Pool)
│   ├── auth/
│   │   ├── jwt.js          # JWT Auth
│   │   ├── token_manager.js # Token Manager (Rotation)
│   │   ├── token_store.js  # Token Storage (Async I/O)
│   │   └── quota_manager.js # Quota Cache Manager
│   ├── routes/
│   │   ├── admin.js        # Admin Routes
│   │   └── sd.js           # SD WebUI Compatible Routes
│   ├── bin/
│   │   ├── antigravity_requester_android_arm64   # Android ARM64 Requester
│   │   ├── antigravity_requester_linux_amd64     # Linux AMD64 Requester
│   │   └── antigravity_requester_windows_amd64.exe # Windows AMD64 Requester
│   ├── config/
│   │   ├── config.js       # Config Loader
│   │   └── init-env.js     # Env Initializer
│   ├── constants/
│   │   ├── index.js        # Constants
│   │   └── oauth.js        # OAuth Constants
│   ├── server/
│   │   └── index.js        # Main Server (Memory & Heartbeat)
│   ├── utils/
│   │   ├── configReloader.js # Config Hot Reload
│   │   ├── deepMerge.js    # Deep Merge Util
│   │   ├── envParser.js    # Env Parser
│   │   ├── errors.js       # Error Handling
│   │   ├── idGenerator.js  # ID Generator
│   │   ├── imageStorage.js # Image Storage
│   │   ├── logger.js       # Logger
│   │   ├── memoryManager.js # Memory Manager
│   │   ├── parameterNormalizer.js # Parameter Normalizer
│   │   ├── paths.js        # Path Util (Pkg Support)
│   │   ├── thoughtSignatureCache.js # Signature Cache
│   │   ├── toolConverter.js # Tool Converter
│   │   ├── toolNameCache.js # Tool Name Cache
│   │   └── utils.js        # Utils Export
│   │   └── converters/     # Format Converters
│   │       ├── common.js   # Common Functions
│   │       ├── openai.js   # OpenAI Format
│   │       ├── claude.js   # Claude Format
│   │       └── gemini.js   # Gemini Format
│   └── AntigravityRequester.js # TLS Requester Wrapper
├── test/
│   ├── test-request.js     # Request Test
│   ├── test-image-generation.js # Image Gen Test
│   ├── test-token-rotation.js # Rotation Test
│   └── test-transform.js   # Transform Test
├── .env                    # Environment Variables (Sensitive)
├── .env.example            # Environment Variables Example
├── config.json             # Basic Config
├── Dockerfile              # Docker Build File
├── docker-compose.yml      # Docker Compose Config
└── package.json            # Project Config
```

## Pro Account Random ProjectId

For Pro subscription accounts, you can skip API verification and use a randomly generated ProjectId:

1. Configure in `config.json`:
```json
{
  "other": {
    "skipProjectIdFetch": true
  }
}
```

2. Run `npm run login`, it will use random ProjectId automatically.

3. Existing accounts will also use random ProjectId automatically.

Note: Only for Pro accounts. Random ProjectId for free accounts has been patched by official.

## Eligibility Verification Auto-fallback

When OAuth logging in or adding Token, the system automatically checks subscription eligibility:

1. **Eligible Account**: Use API returned ProjectId.
2. **Ineligible Account**: Auto-generate random ProjectId.

This ensures:
- Success regardless of Pro subscription status.
- Automatic fallback, no manual intervention.
- Login flow not blocked by eligibility check failures.

## True System Message Merging

Supports merging consecutive system messages at the start with global SystemInstruction:

```
Request Messages:
[system] You are a helper
[system] Please answer in Chinese
[user] Hello

Merged:
SystemInstruction = Global SystemInstruction + "\n\n" + "You are a helper\n\nPlease answer in Chinese"
messages = [{role: user, content: Hello}]
```

This design:
- Compatible with OpenAI multi-system message format.
- Fully utilizes Antigravity SystemInstruction.
- Ensures System Prompt integrity and priority.

## Multi-API Format Support

Supports three API formats, fully implementing parameters:

### OpenAI Format (`/v1/chat/completions`)

```json
{
  "model": "gemini-2.0-flash-thinking-exp",
  "max_tokens": 16000,
  "temperature": 0.7,
  "top_p": 0.9,
  "top_k": 40,
  "thinking_budget": 10000,
  "reasoning_effort": "high",
  "messages": [...]
}
```

| Parameter | Description | Default |
|------|------|--------|
| `max_tokens` | Max Output Tokens | 32000 |
| `temperature` | Temperature (0.0-1.0) | 1 |
| `top_p` | Top-P | 1 |
| `top_k` | Top-K | 50 |
| `thinking_budget` | Thinking Budget (1024-32000) | 1024 |
| `reasoning_effort` | Thinking Effort (`low`/`medium`/`high`) | - |

### Claude Format (`/v1/messages`)

```json
{
  "model": "claude-sonnet-4-5-thinking",
  "max_tokens": 16000,
  "temperature": 0.7,
  "top_p": 0.9,
  "top_k": 40,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 10000
  },
  "messages": [...]
}
```

| Parameter | Description | Default |
|------|------|--------|
| `max_tokens` | Max Output Tokens | 32000 |
| `temperature` | Temperature (0.0-1.0) | 1 |
| `top_p` | Top-P | 1 |
| `top_k` | Top-K | 50 |
| `thinking.type` | Thinking Toggle (`enabled`/`disabled`) | - |
| `thinking.budget_tokens` | Thinking Budget (1024-32000) | 1024 |

### Gemini Format (`/v1beta/models/:model:generateContent`)

```json
{
  "contents": [...],
  "generationConfig": {
    "maxOutputTokens": 16000,
    "temperature": 0.7,
    "topP": 0.9,
    "topK": 40,
    "thinkingConfig": {
      "includeThoughts": true,
      "thinkingBudget": 10000
    }
  }
}
```

| Parameter | Description | Default |
|------|------|--------|
| `maxOutputTokens` | Max Output Tokens | 32000 |
| `temperature` | Temperature (0.0-1.0) | 1 |
| `topP` | Top-P | 1 |
| `topK` | Top-K | 50 |
| `thinkingConfig.includeThoughts` | Include Thoughts | true |
| `thinkingConfig.thinkingBudget` | Thinking Budget (1024-32000) | 1024 |

### Unified Parameter Handling

All three formats are normalized to ensure consistent behavior:

1. **Priority**: Request Params > Config Defaults
2. **Budget Priority**: `thinking_budget`/`budget_tokens`/`thinkingBudget` > `reasoning_effort` > Config Defaults
3. **Disable Thinking**: Set `thinking_budget=0` or `thinking.type="disabled"` or `thinkingConfig.includeThoughts=false`

### DeepSeek Reasoning Format Compatibility

Automatically adapts DeepSeek `reasoning_content` format to output thinking process separately:

```json
{
  "choices": [{
    "message": {
      "content": "Final Answer",
      "reasoning_content": "Thinking Process..."
    }
  }]
}
```

### reasoning_effort Mapping

| Value | Thinking Token Budget |
|---|----------------|
| `low` | 1024 |
| `medium` | 16000 |
| `high` | 32000 |

## Memory Optimization

Deeply optimized for memory:

### Optimization Results

| Metric | Before | After |
|------|--------|--------|
| Processes | 8+ | 2 |
| Memory | 100MB+ | 50MB+ |
| GC Freq | High | Low |

### Techniques

1. **Object Pools**: Reuse stream response objects, reduce 50%+ temp objects.
2. **Pre-compiled Constants**: Avoid repeating creation of Regex/Formats.
3. **LineBuffer Optimization**: Efficient stream line splitting.
4. **Auto Memory Cleanup**: Trigger GC when heap usage exceeds threshold.
5. **Process Reduction**: Remove unnecessary child processes.

### Dynamic Memory Thresholds

Thresholds dynamically calculated based on `memoryThreshold` (MB):

| Pressure | Threshold Ratio | Default (100MB) | Behavior |
|---------|---------|---------------------|------|
| LOW | 30% | 30MB | Normal |
| MEDIUM | 60% | 60MB | Light Cleanup |
| HIGH | 100% | 100MB | Aggressive Cleanup + GC |
| CRITICAL | >100% | >100MB | Emergency Cleanup + Force GC |

### Configuration

```json
{
  "server": {
    "memoryThreshold": 100
  }
}
