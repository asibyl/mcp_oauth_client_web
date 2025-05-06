import type { Config } from "./types"

// OAuth-related session storage keys
export const SESSION_KEYS = {
    CODE_VERIFIER: "mcp_code_verifier",
    SERVER_URL: "mcp_server_url",
    TOKENS: "mcp_tokens",
    CLIENT_INFORMATION: "mcp_client_information",
    ACCESS_TOKEN: "mcp_access_token"
} as const;
  
  // Generate server-specific session storage keys
export const getServerSpecificKey = (
    baseKey: string,
    serverUrl?: string,
  ): string => {
    if (!serverUrl) return baseKey;
    return `[${serverUrl}] ${baseKey}`;
};
  
export const CLIENT_REDIRECT_URL = "/oauth/callback"
export const CLIENT_NAME = "pulley"
export const CLIENT_URI = "https://example.com"

export const LOCAL_STORAGE_KEY = "maker_v1"
export const SERVER_URL_KEY = "last_server_url"
export const DEFAULT_SERVER_URL = "http://localhost:3001/mcp"

export const DEFAULT_CONFIG: Config = {
    MCP_SERVER_MAX_RETRY_ATTEMPTS: {
      label: "Max Retry Attempts",
      description: "Maximum number of retry attempts for failed requests",
      value: 3,
    },
    MCP_SERVER_REQUEST_TIMEOUT: {
      label: "Request Timeout",
      description: "Timeout for requests to the MCP server (ms)",
      value: 5000,
    },
    MCP_REQUEST_TIMEOUT_RESET_ON_PROGRESS: {
      label: "Reset Timeout on Progress",
      description: "Reset timeout on progress notifications",
      value: true,
    },
    MCP_REQUEST_MAX_TOTAL_TIMEOUT: {
      label: "Maximum Total Timeout",
      description:
        "Maximum total timeout for requests sent to the MCP server (ms) (Use with progress notifications)",
      value: 60000,
    }
  } as const;