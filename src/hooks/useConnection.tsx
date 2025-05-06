import { useState } from "react";
import { Config, ConnectionStatus, Notification } from "../types";
import { SESSION_KEYS } from "../constants";
import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { PulleyOAuthClientProvider } from "../auth";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { CancelledNotificationSchema, ClientRequest, PromptListChangedNotificationSchema, ToolListChangedNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { 
    LoggingMessageNotificationSchema, 
    ResourceUpdatedNotificationSchema, 
    ResourceListChangedNotificationSchema, 
    ServerCapabilities } from "@modelcontextprotocol/sdk/types.js";
import { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { z } from "zod";

interface UseConnectionOptions {
    serverUrl: string
    config: Config
    onNotification?: (notification: Notification) => void;
    onStdErrNotification?: (notification: Notification) => void;
    onPendingRequest?: (request: any, resolve: any, reject: any) => void;
}

export function useConnection({
    serverUrl,
    config,
    onNotification
} :UseConnectionOptions) {
    
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
    const [client, setClient] = useState<Client | null>(null);
    const [serverCapabilities, setServerCapabilities] = useState<ServerCapabilities | null>(null);
    
    const connect = async (_e?: unknown, retryCount: number = 0) =>{ // what's e?
        // Handle 2 modes:
        // 1. No access token: Trigger OAuth flow
        // 2. Access token available, no client: Create client and connect to server
        // 3. Access token available, client set up: should not land here 

        // 1. No access token: Trigger OAuth flow
        // New session: authorize and retry
        const accessToken = sessionStorage.getItem(SESSION_KEYS.ACCESS_TOKEN)
        if (!accessToken) {
            console.log("Using Connection in Mode 1: No session (access) token available")
            const clientAuthProvider = new PulleyOAuthClientProvider(serverUrl);
            let result = await auth(clientAuthProvider, {serverUrl,});
            if (result === 'AUTHORIZED') { 
                // presumably auth provider has saved received access_token as session token in session storage
                const accessToken = sessionStorage.getItem(SESSION_KEYS.ACCESS_TOKEN)
                console.log("OAuth flow successful with session token:", accessToken)
                return connect(undefined, retryCount + 1); 
            } 
        }

        // 2. Session token available, but no client set up: Create client and connect to server
        // (flow returns here through OAuthCallback in Connection component)
        if (!client) {
            console.log("Using Connection in Mode 2: Session (access) token available, client not set up")
            const accessToken = sessionStorage.getItem(SESSION_KEYS.ACCESS_TOKEN)
            if (!accessToken) {
                throw new Error("No bearer token available")
            }

            // 2.1 Create MCP client
            const client = new Client(
                { name: "Pulley", version: "1.0.0" },
                { capabilities: { sampling: {}, roots: { listChanged: true } } }
            );

            // 2.2 Set notification handlers
            if (onNotification) {
                [
                CancelledNotificationSchema,
                LoggingMessageNotificationSchema,
                ResourceUpdatedNotificationSchema,
                ResourceListChangedNotificationSchema,
                ToolListChangedNotificationSchema,
                PromptListChangedNotificationSchema,
                ].forEach((notificationSchema) => {
                client.setNotificationHandler(notificationSchema, onNotification);
                });
        
                client.fallbackNotificationHandler = (
                notification: Notification,
                ): Promise<void> => {
                onNotification(notification);
                return Promise.resolve();
                };
            }
    
            // 2.3 Create transport with init request headers
            const transport = new StreamableHTTPClientTransport(
                new URL(serverUrl),
                { 
                sessionId: undefined, // sessionId remains undefined until the sdk client & transport are set up
                requestInit: { 
                    headers: { 
                    'Content-Type': 'application/json',
                    "Accept": "application/json",
                    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }) // use session token as bearer token for authorized access to MCP server (POST to /mcp)
                    } 
                }
                } 
            ); 

            // 2.4 Connect to server
            let capabilities: ServerCapabilities | undefined;
            try {
                await client.connect(transport); // uses initialize method if session id not set on transport and sends notifications/initialized event on transport
                console.log("Connected to MCP server")
                capabilities = client.getServerCapabilities();
                console.log("Server Capabilities:", capabilities)
                console.log("Server Info:", client.getServerVersion())
                console.log("Server Instructions:", client.getInstructions())
            } catch (error) {
                console.error('Error initializing connection with MCP server:', error);
                setConnectionStatus('error');

                // token may have expired, re-authorize and retry(caution: this can go into a loop?)
                console.log("Attempting to re-authorize and retry connection")
                const authProvider = new PulleyOAuthClientProvider(serverUrl);
                const result = await auth(authProvider, { serverUrl: serverUrl });
                if (result === 'AUTHORIZED') {
                    return connect(undefined, retryCount + 1);
                }

                throw error;
            }

            // 2.5 Set server capabilities, client and connection status state
            setServerCapabilities(capabilities ?? null);
            setClient(client);
            setConnectionStatus('connected');
        }

        // 3. Session and client already set up: Connect to server
        // not needed, can be performed through the client & transport which have session id initialized from server
 
    
    }

    const disconnect = async () =>{
        await client?.close();
        const clientAuthProvider = new PulleyOAuthClientProvider(serverUrl);
        await clientAuthProvider.clear(); // should clear session token (with any other tokens)
        sessionStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN)
        setClient(null);
        setConnectionStatus('disconnected');
        setServerCapabilities(null);
    }

    const makeRequest = async <T extends z.ZodType>(
        request: ClientRequest,
        schema: T,
        options?: RequestOptions,
      ): Promise<z.output<T>> => {
        if (!client) {
            throw new Error("MCP client not connected");
        }

        try {
            const abortController = new AbortController();
            
            // prepare MCP Client request options
            const mcpRequestOptions: RequestOptions = {

                signal: options?.signal ?? abortController.signal,
                
                resetTimeoutOnProgress:
                  options?.resetTimeoutOnProgress ??
                  config.MCP_REQUEST_TIMEOUT_RESET_ON_PROGRESS.value as boolean,
                
                timeout: options?.timeout ?? config.MCP_SERVER_REQUEST_TIMEOUT.value as number,
                
                maxTotalTimeout:
                  options?.maxTotalTimeout ??
                  config.MCP_REQUEST_MAX_TOTAL_TIMEOUT.value as number,
            };

            // TODO: If progress notifications are enabled, add an onprogress hook to the MCP Client request options

            let response = await client.request(request, schema, mcpRequestOptions);
            return response;

        } catch (error) {
            console.log("Error making client request:", error);
            throw error;
        }
    }

    return {
        connectionStatus,
        client,
        serverCapabilities,
        connectToServer: connect,
        disconnectFromServer: disconnect,
        makeRequest: makeRequest
    }
}