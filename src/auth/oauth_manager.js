import axios from 'axios';
import crypto from 'crypto';
import log from '../utils/logger.js';
import config from '../config/config.js';
import { generateProjectId } from '../utils/idGenerator.js';
import tokenManager from './token_manager.js';
import { OAUTH_CONFIG, OAUTH_SCOPES } from '../constants/oauth.js';
import { buildAxiosRequestConfig } from '../utils/httpClient.js';

class OAuthManager {
  constructor() {
    this.state = crypto.randomUUID();
  }

  /**
   * Generate Auth URL
   */
  generateAuthUrl(port) {
    const params = new URLSearchParams({
      access_type: 'offline',
      client_id: OAUTH_CONFIG.CLIENT_ID,
      prompt: 'consent',
      redirect_uri: `http://localhost:${port}/oauth-callback`,
      response_type: 'code',
      scope: OAUTH_SCOPES.join(' '),
      state: this.state
    });
    return `${OAUTH_CONFIG.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange auth code for Token
   */
  async exchangeCodeForToken(code, port) {
    const postData = new URLSearchParams({
      code,
      client_id: OAUTH_CONFIG.CLIENT_ID,
      client_secret: OAUTH_CONFIG.CLIENT_SECRET,
      redirect_uri: `http://localhost:${port}/oauth-callback`,
      grant_type: 'authorization_code'
    });

    const response = await axios(buildAxiosRequestConfig({
      method: 'POST',
      url: OAUTH_CONFIG.TOKEN_URL,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: postData.toString(),
      timeout: config.timeout
    }));

    return response.data;
  }

  /**
   * Get user email
   */
  async fetchUserEmail(accessToken) {
    try {
      const response = await axios(buildAxiosRequestConfig({
        method: 'GET',
        url: 'https://www.googleapis.com/oauth2/v2/userinfo',
        headers: {
          'Host': 'www.googleapis.com',
          'User-Agent': 'Go-http-client/1.1',
          'Authorization': `Bearer ${accessToken}`,
          'Accept-Encoding': 'gzip'
        },
        timeout: config.timeout
      }));
      return response.data?.email;
    } catch (err) {
      log.warn('Failed to get user email:', err.message);
      return null;
    }
  }

  /**
   * Quota validation: Attempt to get projectId, fallback to random projectId on failure
   */
  async validateAndGetProjectId(accessToken) {
    // If configured to skip API verification, return random projectId directly
    if (config.skipProjectIdFetch) {
      const projectId = generateProjectId();
      log.info('API verification skipped, using randomly generated projectId: ' + projectId);
      return { projectId, hasQuota: true };
    }

    // Attempt to get projectId from API
    try {
      log.info('Verifying account eligibility...');
      const projectId = await tokenManager.fetchProjectId({ access_token: accessToken });

      if (projectId === undefined) {
        // Not eligible, automatically fallback to random projectId
        const randomProjectId = generateProjectId();
        log.warn('Account not eligible, automatically fallback to ineligible mode, using random projectId: ' + randomProjectId);
        return { projectId: randomProjectId, hasQuota: false };
      }

      log.info('Account verification passed, projectId: ' + projectId);
      return { projectId, hasQuota: true };
    } catch (err) {
      // Fallback to random projectId on failure
      const randomProjectId = generateProjectId();
      log.warn('Account verification failed: ' + err.message + ', automatically fallback to ineligible mode');
      log.info('Using randomly generated projectId: ' + randomProjectId);
      return { projectId: randomProjectId, hasQuota: false };
    }
  }

  /**
   * Complete OAuth authentication flow: Exchange Token -> Get Email -> Validate Quota
   */
  async authenticate(code, port) {
    // 1. Exchange auth code for Token
    const tokenData = await this.exchangeCodeForToken(code, port);

    if (!tokenData.access_token) {
      throw new Error('Token exchange failed: access_token not received');
    }

    const account = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      timestamp: Date.now()
    };

    // 2. Get user email
    const email = await this.fetchUserEmail(account.access_token);
    if (email) {
      account.email = email;
      log.info('User email retrieved: ' + email);
    }

    // 3. Validate quota and get projectId
    const { projectId, hasQuota } = await this.validateAndGetProjectId(account.access_token);
    account.projectId = projectId;
    account.hasQuota = hasQuota;
    account.enable = true;

    return account;
  }
}

export default new OAuthManager();
