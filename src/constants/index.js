/**
 * Application Constants Definition
 * @module constants
 */

// ==================== Cache Constants ====================

/**
 * File cache TTL (ms)
 * @type {number}
 */
export const FILE_CACHE_TTL = 5000;

/**
 * File save delay (ms) - For debounce
 * @type {number}
 */
export const FILE_SAVE_DELAY = 1000;

/**
 * Quota cache TTL (ms) - 5 minutes
 * @type {number}
 */
export const QUOTA_CACHE_TTL = 5 * 60 * 1000;

/**
 * Quota cleanup interval (ms) - 1 hour
 * @type {number}
 */
export const QUOTA_CLEANUP_INTERVAL = 60 * 60 * 1000;

/**
 * Model list cache default TTL (ms) - 1 hour
 * @type {number}
 */
export const MODEL_LIST_CACHE_TTL = 60 * 60 * 1000;

// ==================== Memory Management Constants ====================

// Note: Memory pressure thresholds are now dynamically calculated by memoryManager based on user configured memoryThreshold
// User configured memoryThreshold (MB) is the HIGH pressure threshold, others are calculated proportionally:
// - LOW: 30% of threshold
// - MEDIUM: 60% of threshold
// - HIGH: 100% of threshold (User configured)
// - TARGET: 50% of threshold

/**
 * GC Cooldown (ms)
 * @type {number}
 */
export const GC_COOLDOWN = 10000;

/**
 * Default memory check interval (ms)
 * @type {number}
 */
export const MEMORY_CHECK_INTERVAL = 30000;

// ==================== Server Constants ====================

/**
 * Default heartbeat interval (ms)
 * @type {number}
 */
export const DEFAULT_HEARTBEAT_INTERVAL = 15000;

/**
 * Default server port
 * @type {number}
 */
export const DEFAULT_SERVER_PORT = 8045;

/**
 * Default server host
 * @type {string}
 */
export const DEFAULT_SERVER_HOST = '0.0.0.0';

/**
 * Default request timeout (ms)
 * @type {number}
 */
export const DEFAULT_TIMEOUT = 300000;

/**
 * Default retry times
 * @type {number}
 */
export const DEFAULT_RETRY_TIMES = 3;

/**
 * Default max request body size
 * @type {string}
 */
export const DEFAULT_MAX_REQUEST_SIZE = '50mb';

// ==================== Token Rotation Constants ====================

/**
 * Default rotation request count per token
 * @type {number}
 */
export const DEFAULT_REQUEST_COUNT_PER_TOKEN = 50;

/**
 * Token refresh buffer before expiration (ms) - 5 minutes
 * @type {number}
 */
export const TOKEN_REFRESH_BUFFER = 300000;

// ==================== Generation Default Params ====================

/**
 * Default generation params
 */
export const DEFAULT_GENERATION_PARAMS = {
  temperature: 1,
  top_p: 0.85,
  top_k: 50,
  max_tokens: 32000,
  thinking_budget: 1024
};

/**
 * Map reasoning_effort to thinkingBudget
 */
export const REASONING_EFFORT_MAP = {
  low: 1024,
  medium: 16000,
  high: 32000
};

// ==================== Image Constants ====================

/**
 * Default max images to retain
 * @type {number}
 */
export const DEFAULT_MAX_IMAGES = 10;

/**
 * MIME type to file extension map
 */
export const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
};

// ==================== Stop Sequences ====================

/**
 * Default stop sequences
 * @type {string[]}
 */
export const DEFAULT_STOP_SEQUENCES = [
  '<|user|>',
  '<|bot|>',
  '<|context_request|>',
  '<|endoftext|>',
  '<|end_of_turn|>'
];

// ==================== Admin Default Config ====================

// Note: Admin credentials (username, password, JWT secret) are now automatically generated in config.js
// If not configured, generated credentials will be displayed in console at startup
// No longer using hardcoded defaults for security