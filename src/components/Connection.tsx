import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { Button, VStack, Text, HStack, Badge, Box, Input, Tabs, Flex, Heading } from '@chakra-ui/react'
import { DEFAULT_CONFIG, DEFAULT_SERVER_URL, SERVER_URL_KEY } from '../constants'
import { useConnection } from '../hooks/useConnection'
import { z } from 'zod'
import { ClientRequest, ListToolsResultSchema, Tool, CompatibilityCallToolResult, CompatibilityCallToolResultSchema, ServerNotification } from '@modelcontextprotocol/sdk/types.js'
import ToolsTab from './ToolsTab'
import ToolForm from './ToolForm'

export function Connection() {
    const [serverUrl, setServerUrl] = useState<string>(() => {
        return sessionStorage.getItem(SERVER_URL_KEY) || DEFAULT_SERVER_URL;
    })
    const [tools, setTools] = useState<Tool[]>([])
    const [toolResult, setToolResult] = useState<CompatibilityCallToolResult | null>(null)
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [nextToolCursor, setNextToolCursor] = useState<string | undefined>();
    const [notifications, setNotifications] = useState<ServerNotification[]>([]);
    const [errors, setErrors] = useState<Record<string, string | null>>({
        tool: null,
        prompt: null,
        resource: null,
    });

    const progressTokenRef = useRef(0);
    
    const { connectionStatus,
        client,
        serverCapabilities,
        connectToServer, 
        disconnectFromServer,
        makeRequest
        } = useConnection({
            serverUrl: serverUrl,
            config: DEFAULT_CONFIG,
            onNotification: (notification) => {
                setNotifications((prev) => [...prev, notification as ServerNotification])
            }
    })

    useEffect(() => {
        sessionStorage.setItem(SERVER_URL_KEY, serverUrl);
    }, [serverUrl]);

    const onOAuthConnect = useCallback(
        (serverUrl: string) => {
          setServerUrl(serverUrl); 
          void connectToServer();
        },
        [connectToServer],
    );

    if (window.location.pathname === "/oauth/callback") {
        const OAuthCallback = React.lazy(
          () => import("./OAuthCallback"),
        );
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <OAuthCallback onConnect={onOAuthConnect} /> 
          </Suspense>
        );
    }

    const sendRequest = async <T extends z.ZodType>(request: ClientRequest, schema: T) => {
        try {
            const response = await makeRequest(request, schema);
            return response;
        } catch (error) {
            throw error;
        }
    }

    const listTools = async () => {
        const response = await sendRequest(
          {
            method: "tools/list" as const,
            params: nextToolCursor ? { cursor: nextToolCursor } : {},
          },
          ListToolsResultSchema
        );
        setTools(response.tools);
        setNextToolCursor(response.nextCursor);
    };

    const clearError = (key: keyof typeof errors) => {
        setErrors((prev) => ({ ...prev, [key]: null }));
    };

    const callTool = async (name: string, params: Record<string, unknown>) => {
        try {
          const response = await sendRequest(
            {
              method: "tools/call" as const,
              params: {
                name,
                arguments: params,
                _meta: {
                  progressToken: progressTokenRef.current++,
                },
              },
            },
            CompatibilityCallToolResultSchema
          );
          setToolResult(response);
        } catch (e) {
          const toolResult: CompatibilityCallToolResult = {
            content: [
              {
                type: "text",
                text: (e as Error).message ?? String(e),
              },
            ],
            isError: true,
          };
          setToolResult(toolResult);
        }
    };

    return (
        <Flex height="100vh" width="100vw" bg="gray.50">
            <VStack flex="1" maxW="500px" minW="400px" p={4} gap={6}>
                <Heading>Connect</Heading>
                <Box w="100%">
                    <HStack gap={2} mb={4}>
                        <Input 
                            placeholder="Server URL"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                        />
                        <Button loadingText="Connecting..." colorPalette="blue" variant="solid"
                            onClick={() => {
                                if (connectionStatus === 'connected') {
                                    disconnectFromServer()
                                } else {
                                    connectToServer()
                                }
                            }}
                        >
                            {connectionStatus === 'connected' ? 'Disconnect' : 'Connect'}
                        </Button>
                    </HStack>
                    <Badge ml={2}>
                            {connectionStatus}
                    </Badge>
                </Box>
                <Box w="100%">
                    <VStack w="100%" gap={2}>
                        { (client && serverCapabilities) ? (
                            <>
                                <Text fontSize="md" fontWeight="bold" mb={2}>
                                    Select Server Capability
                                </Text>
                                <Tabs.Root defaultValue="tools" fitted w="100%">
                                <Tabs.List>
                                    <Tabs.Trigger value="tools" disabled={!serverCapabilities?.tools}>Tools</Tabs.Trigger>
                                    <Tabs.Trigger value="prompts" disabled={!serverCapabilities?.prompts}>Prompts</Tabs.Trigger>
                                    <Tabs.Trigger value="resources" disabled={!serverCapabilities?.resources}>Resources</Tabs.Trigger>
                                </Tabs.List>
                                <ToolsTab
                                    tools={tools}
                                    listTools={() => { clearError("tools"); listTools() } }
                                    clearTools={() => { setTools([]); setNextToolCursor(undefined); setToolResult(null); setSelectedTool(null); setNotifications([]) } }
                                    selectedTool={selectedTool}
                                    setSelectedTool={setSelectedTool}
                                    nextCursor={nextToolCursor}
                                    error={errors.tools} />
                                </Tabs.Root>
                            </>
                        ) : (
                            <Text>Connect to a server to see server capabilities</Text>
                        )}
                    </VStack>
                </Box>
            </VStack>
            <VStack flex="2" p={4} gap={6} bg="gray.100" maxWidth="100%">
                <Heading>Run</Heading>
                {/* for selected tool, render form with params */}
                {selectedTool && 
                    <ToolForm 
                    tool={selectedTool} 
                    callTool={ async (name: string, params: Record<string, unknown>) => {
                        clearError("tools")
                        setToolResult(null)
                        await callTool(name, params)
                    } }
                    />
                }
            </VStack>
            <VStack flex="3" p={4} gap={6} bg="gray.200" maxWidth="100%">
                <Heading>Inspect</Heading>
                {/* display tool result and notifications; TODO: replce with independent component */}
                {toolResult && <Text>{JSON.stringify(toolResult)}</Text>}
                {notifications.map((notification, index) => (
                    <>
                        <Text key={index}>{notification.method}</Text>
                        <Text key={index}>{JSON.stringify(notification.params)}</Text>
                    </>
                ))}
            </VStack>
        </Flex>
    )
}