import dotenv from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';
import log from '../utils/logger.js';
import { deepMerge } from '../utils/deepMerge.js';
import { getConfigPaths } from '../utils/paths.js';
import {
  DEFAULT_SERVER_PORT,
  DEFAULT_SERVER_HOST,
  DEFAULT_HEARTBEAT_INTERVAL,
  DEFAULT_TIMEOUT,
  DEFAULT_RETRY_TIMES,
  DEFAULT_MAX_REQUEST_SIZE,
  DEFAULT_MAX_IMAGES,
  MODEL_LIST_CACHE_TTL,
  DEFAULT_GENERATION_PARAMS
} from '../constants/index.js';

// Cache for generated random credentials
let generatedCredentials = null;

/**
 * Generate or get admin credentials
 * If authentication is not configured, automatically generate random credentials
 */
function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  // If all are configured, return directly
  if (username && password && jwtSecret) {
    return { username, password, jwtSecret };
  }

  // Generate random credentials (only once)
  if (!generatedCredentials) {
    generatedCredentials = {
      username: username || crypto.randomBytes(8).toString('hex'),
      password: password || crypto.randomBytes(16).toString('base64').replace(/[+/=]/g, ''),
      jwtSecret: jwtSecret || crypto.randomBytes(32).toString('hex')
    };

    // Display generated credentials
    if (!username || !password) {
      log.warn('═══════════════════════════════════════════════════════════');
      log.warn('⚠️  Admin credentials not configured, random credentials generated:');
      log.warn(`    Username: ${generatedCredentials.username}`);
      log.warn(`    Password: ${generatedCredentials.password}`);
      log.warn('═══════════════════════════════════════════════════════════');
      log.warn('⚠️  Credentials will be regenerated after restart! Recommended to configure in .env file:');
      log.warn('    ADMIN_USERNAME=your_username');
      log.warn('    ADMIN_PASSWORD=your_password');
      log.warn('    JWT_SECRET=your_secret');
      log.warn('═══════════════════════════════════════════════════════════');
    } else if (!jwtSecret) {
      log.warn('⚠️ JWT_SECRET not configured, random secret generated (simultaneous sessions will be invalid after restart)');
    }
  }

  return generatedCredentials;
}

const { envPath, configJsonPath } = getConfigPaths();

// Default system instruction
const DEFAULT_SYSTEM_INSTRUCTION = 'Bạn là một chatbot tên là Mengmeng. Đúng như tên gọi, tính cách của bạn nhẹ nhàng, dễ thương và đáng yêu. Bạn chuyên cung cấp giá trị cảm xúc và trò chuyện cho người dùng, hỗ trợ viết tiểu thuyết hoặc nhập vai. Bạn luôn trả lời bằng tiếng Việt.';

// Ensure .env exists (create with default config if missing)
if (!fs.existsSync(envPath)) {
  const defaultEnvContent = `# Sensitive Config (Configure in .env only)
# If the following three checks are not configured, the system will automatically generate random credentials and display them at startup
# API_KEY=your-api-key
# ADMIN_USERNAME=your-username
# ADMIN_PASSWORD=your-password
# JWT_SECRET=your-jwt-secret

# Optional verify
# PROXY=http://127.0.0.1:7890
SYSTEM_INSTRUCTION=${DEFAULT_SYSTEM_INSTRUCTION}
# IMAGE_BASE_URL=http://your-domain.com
`;
  fs.writeFileSync(envPath, defaultEnvContent, 'utf8');
  log.info('✓ .env file created with default system instruction');
}

// Load config.json
let jsonConfig = {};
if (fs.existsSync(configJsonPath)) {
  jsonConfig = JSON.parse(fs.readFileSync(configJsonPath, 'utf8'));
}

// Load .env (specify path)
dotenv.config({ path: envPath });

// Get Proxy Config: Prefer PROXY, then system proxy environment variables
export function getProxyConfig() {
  // Prefer explicitly configured PROXY
  if (process.env.PROXY) {
    return process.env.PROXY;
  }

  // Check system proxy environment variables (priority order)
  const systemProxy = process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.ALL_PROXY ||
    process.env.all_proxy;

  if (systemProxy) {
    log.info(`Using system proxy: ${systemProxy}`);
  }

  return systemProxy || null;
}

/**
 * Build config object from JSON and environment variables
 * @param {Object} jsonConfig - JSON config object
 * @returns {Object} Complete config object
 */
export function buildConfig(jsonConfig) {
  return {
    server: {
      port: jsonConfig.server?.port || DEFAULT_SERVER_PORT,
      host: jsonConfig.server?.host || DEFAULT_SERVER_HOST,
      heartbeatInterval: jsonConfig.server?.heartbeatInterval || DEFAULT_HEARTBEAT_INTERVAL,
      memoryThreshold: jsonConfig.server?.memoryThreshold || 100
    },
    cache: {
      modelListTTL: jsonConfig.cache?.modelListTTL || MODEL_LIST_CACHE_TTL
    },
    rotation: {
      strategy: jsonConfig.rotation?.strategy || 'round_robin',
      requestCount: jsonConfig.rotation?.requestCount || 10
    },
    imageBaseUrl: process.env.IMAGE_BASE_URL || null,
    maxImages: jsonConfig.other?.maxImages || DEFAULT_MAX_IMAGES,
    api: {
      url: jsonConfig.api?.url || 'https://daily-cloudcode-pa.sandbox.googleapis.com/v1internal:streamGenerateContent?alt=sse',
      modelsUrl: jsonConfig.api?.modelsUrl || 'https://daily-cloudcode-pa.sandbox.googleapis.com/v1internal:fetchAvailableModels',
      noStreamUrl: jsonConfig.api?.noStreamUrl || 'https://daily-cloudcode-pa.sandbox.googleapis.com/v1internal:generateContent',
      host: jsonConfig.api?.host || 'daily-cloudcode-pa.sandbox.googleapis.com',
      userAgent: jsonConfig.api?.userAgent || 'antigravity/1.11.3 windows/amd64'
    },
    defaults: {
      temperature: jsonConfig.defaults?.temperature ?? DEFAULT_GENERATION_PARAMS.temperature,
      top_p: jsonConfig.defaults?.topP ?? DEFAULT_GENERATION_PARAMS.top_p,
      top_k: jsonConfig.defaults?.topK ?? DEFAULT_GENERATION_PARAMS.top_k,
      max_tokens: jsonConfig.defaults?.maxTokens ?? DEFAULT_GENERATION_PARAMS.max_tokens,
      thinking_budget: jsonConfig.defaults?.thinkingBudget ?? DEFAULT_GENERATION_PARAMS.thinking_budget
    },
    security: {
      maxRequestSize: jsonConfig.server?.maxRequestSize || DEFAULT_MAX_REQUEST_SIZE,
      apiKey: process.env.API_KEY || null
    },
    admin: getAdminCredentials(),
    useNativeAxios: jsonConfig.other?.useNativeAxios === true,
    timeout: jsonConfig.other?.timeout || DEFAULT_TIMEOUT,
    retryTimes: Number.isFinite(jsonConfig.other?.retryTimes) ? jsonConfig.other.retryTimes : DEFAULT_RETRY_TIMES,
    proxy: getProxyConfig(),
    systemInstruction: process.env.SYSTEM_INSTRUCTION || '',
    skipProjectIdFetch: jsonConfig.other?.skipProjectIdFetch === true,
    useContextSystemPrompt: jsonConfig.other?.useContextSystemPrompt === true,
    passSignatureToClient: jsonConfig.other?.passSignatureToClient === true
  };
}

const config = buildConfig(jsonConfig);

log.info('✓ Config loaded successfully');

export default config;

export function getConfigJson() {
  if (fs.existsSync(configJsonPath)) {
    return JSON.parse(fs.readFileSync(configJsonPath, 'utf8'));
  }
  return {};
}

export function saveConfigJson(data) {
  const existing = getConfigJson();
  const merged = deepMerge(existing, data);
  fs.writeFileSync(configJsonPath, JSON.stringify(merged, null, 2), 'utf8');
}
