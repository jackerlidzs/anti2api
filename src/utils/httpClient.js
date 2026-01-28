import axios from 'axios';
import dns from 'dns';
import http from 'http';
import https from 'https';
import config from '../config/config.js';

// ==================== DNS & Proxy Configuration ====================

// Custom DNS lookup: Prefer IPv4, fallback to IPv6 if failed
function customLookup(hostname, options, callback) {
  dns.lookup(hostname, { ...options, family: 4 }, (err4, address4, family4) => {
    if (!err4 && address4) {
      return callback(null, address4, family4);
    }
    dns.lookup(hostname, { ...options, family: 6 }, (err6, address6, family6) => {
      if (!err6 && address6) {
        return callback(null, address6, family6);
      }
      callback(err4 || err6);
    });
  });
}

// Agent using custom DNS lookup (Prefer IPv4, fallback IPv6)
const httpAgent = new http.Agent({
  lookup: customLookup,
  keepAlive: true
});

const httpsAgent = new https.Agent({
  lookup: customLookup,
  keepAlive: true
});

// Build proxy configuration
function buildProxyConfig() {
  if (!config.proxy) return false;
  try {
    const proxyUrl = new URL(config.proxy);
    return {
      protocol: proxyUrl.protocol.replace(':', ''),
      host: proxyUrl.hostname,
      port: parseInt(proxyUrl.port, 10)
    };
  } catch {
    return false;
  }
}

// Build unified request config for axios
export function buildAxiosRequestConfig({ method = 'POST', url, headers, data = null, timeout = config.timeout }) {
  const axiosConfig = {
    method,
    url,
    headers,
    timeout,
    httpAgent,
    httpsAgent,
    proxy: buildProxyConfig()
  };

  if (data !== null) axiosConfig.data = data;
  return axiosConfig;
}

// Simple axios wrapper for easy extension (retry, logging, etc.)
export async function httpRequest(configOverrides) {
  const axiosConfig = buildAxiosRequestConfig(configOverrides);
  return axios(axiosConfig);
}

// Stream request wrapper
export async function httpStreamRequest(configOverrides) {
  const axiosConfig = buildAxiosRequestConfig(configOverrides);
  axiosConfig.responseType = 'stream';
  return axios(axiosConfig);
}
