// MCP Client Types
export type ConfigItem = {
    label: string;
    description: string;
    value: string | number | boolean;
};
  
export type Config = {
    MCP_SERVER_MAX_RETRY_ATTEMPTS: ConfigItem;
    MCP_SERVER_REQUEST_TIMEOUT: ConfigItem;
    MCP_REQUEST_TIMEOUT_RESET_ON_PROGRESS: ConfigItem;
    MCP_REQUEST_MAX_TOTAL_TIMEOUT: ConfigItem;
};

export type ConnectionStatus = "disconnected" | "connected" | "error" | "unauthenticated"

import {
    NotificationSchema as BaseNotificationSchema,
    ClientNotificationSchema,
    ServerNotificationSchema,
  } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const NotificationSchema = ClientNotificationSchema
    .or(ServerNotificationSchema)
    .or(BaseNotificationSchema);
  
export type Notification = z.infer<typeof NotificationSchema>;