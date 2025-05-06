import { toaster } from "./ui/toaster";
import { useEffect, useRef, useState } from "react";
import { parseOAuthCallbackParams, generateOAuthErrorDescription } from "../utils/oauthUtils";
import { SERVER_URL_KEY, SESSION_KEYS } from "../constants";
import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { PulleyOAuthClientProvider } from "../auth";
import { Box, Flex, Text } from "@chakra-ui/react";

interface OAuthCallbackProps {
    onConnect: (serverUrl: string) => void;
  }

export default function OAuthCallback({ onConnect }: OAuthCallbackProps) {
    const hasProcessedRef = useRef(false)
    const [accessToken, setAccessToken] = useState<string | undefined>(() => 
        sessionStorage.getItem(SESSION_KEYS.ACCESS_TOKEN) || undefined
    );

    useEffect(() => {
        const handleCallback = async () => {
            if (hasProcessedRef.current) {
                return;
            }
            hasProcessedRef.current = true; 

            const notifyError = (description: string) =>
                toaster.create({
                    title: "OAuth Authorization Error",
                    description
                });

            const params = parseOAuthCallbackParams(window.location.search);
            if (!params.successful) {
                return notifyError(generateOAuthErrorDescription(params));
            }

            const serverUrl = sessionStorage.getItem(SERVER_URL_KEY)
            if (!serverUrl) {
                return notifyError("Missing Server URL")
            }

            let result;
            try {
                const authProvider = new PulleyOAuthClientProvider(serverUrl);
                result = await auth(authProvider, {
                    serverUrl,
                    authorizationCode: params.code,
                });
                const tokens = await authProvider.tokens()
                const token = tokens?.access_token
                if (token) {
                    setAccessToken(token); 
                }
            } catch (error) {
                return notifyError(`Unexpected error occurred: ${error}`);
            }

            if (result !== "AUTHORIZED") {
                return notifyError(`Expected to be authorized after providing auth code, got: ${result}`);
            }

            onConnect(serverUrl);
        };

    handleCallback().finally(() => {window.history.replaceState({}, document.title, "/");});
    
    }, [onConnect, setAccessToken]);

    return (
        
            <Box flex="1" maxW="500px" minW="400px" p={4} gap={6}>
                <Text> Processing OAuth callback... </Text>
            </Box>
        
    )

}