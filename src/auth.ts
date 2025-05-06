import { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js'
import {
    OAuthClientInformationSchema,
    OAuthClientInformation,
    OAuthTokens,
    OAuthTokensSchema,
} from '@modelcontextprotocol/sdk/shared/auth.js' 
import { CLIENT_NAME, CLIENT_REDIRECT_URL, CLIENT_URI, getServerSpecificKey, SESSION_KEYS } from './constants'


export class PulleyOAuthClientProvider implements OAuthClientProvider {
    constructor(private serverUrl: string) {
        sessionStorage.setItem(SESSION_KEYS.SERVER_URL, serverUrl)
    }

    get redirectUrl(): string {
        return window.location.origin + CLIENT_REDIRECT_URL
    }

    get clientMetadata() {
        return {
            redirect_uris: [this.redirectUrl],
            token_endpoint_auth_method: "none",
            grant_types: ["authorization_code"],
            response_types: ["code"],
            client_name: CLIENT_NAME,
            client_uri: CLIENT_URI
        }
    }

    async clientInformation() {
        const key = getServerSpecificKey(SESSION_KEYS.CLIENT_INFORMATION, this.serverUrl)
        const value = sessionStorage.getItem(key)
        if (!value) {
            return undefined
        }
        return await OAuthClientInformationSchema.parseAsync(JSON.parse(value))
    }

    saveClientInformation(clientInformation: OAuthClientInformation): void | Promise<void> {
        const key = getServerSpecificKey(SESSION_KEYS.CLIENT_INFORMATION, this.serverUrl)
        sessionStorage.setItem(key, JSON.stringify(clientInformation))
    }

    async tokens() {
        const key = getServerSpecificKey(SESSION_KEYS.TOKENS, this.serverUrl)
        const value = sessionStorage.getItem(key)
        if (!value) {
            return undefined
        }
        return await OAuthTokensSchema.parseAsync(JSON.parse(value))
    }

    saveTokens(tokens: OAuthTokens) {
        const key = getServerSpecificKey(SESSION_KEYS.TOKENS, this.serverUrl)
        sessionStorage.setItem(key, JSON.stringify(tokens))
        sessionStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, tokens.access_token)
    }

    redirectToAuthorization(authorizationUrl: URL) {
        window.location.href = authorizationUrl.href
    }

    saveCodeVerifier(codeVerifier: string) {
        const key = getServerSpecificKey(SESSION_KEYS.CODE_VERIFIER, this.serverUrl)
        sessionStorage.setItem(key, codeVerifier)
    }

    codeVerifier() {
        const key = getServerSpecificKey(SESSION_KEYS.CODE_VERIFIER, this.serverUrl)
        const verifier = sessionStorage.getItem(key)
        if (!verifier) {
            throw new Error("No code verifier saved for this session")
        }
        return verifier
    }

    clear() {
        sessionStorage.removeItem(SESSION_KEYS.CLIENT_INFORMATION)
        sessionStorage.removeItem(SESSION_KEYS.TOKENS)
        sessionStorage.removeItem(SESSION_KEYS.CODE_VERIFIER)
        sessionStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN)
    }

    async refreshTokens() {
        const tokens = await this.tokens()
        if (!tokens) {
            throw new Error("No tokens saved for this session")
        }
    }

    async revokeTokens() {
        const tokens = await this.tokens()
        if (!tokens) {
            throw new Error("No tokens saved for this session")
        }
    }


}