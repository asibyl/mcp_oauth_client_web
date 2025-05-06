# Implementing an MCP Client with Browser-based OAuth

## Demo


https://github.com/user-attachments/assets/c953b921-c8f8-474b-892b-9f2aa5bce33d



## Overview

The purpose of this project is to implement an MCP Client with end-to-end OAuth support with a Streamable HTTP Server and then use it to inspect the transport and messages exchanged with the MCP Server. 

At a minimum, this requires implementing an OAuthClientProvider that saves and retrieves auth information in session storage. When the user requests to connect with a server in the *Connect* panel, the client handles this through the `useConnection` hook, where the `connect` method works in two modes:

_Mode 1_: No access token available -> (1) trigger OAuth flow through the server's `authorize` endpoint, (2) acquire an access token when the server returns an auth code 

_Mode 2_: Access token available, no transport set up: (1) create client and transport, (2) connect to server, (3) retrieve server capabilities

Once the server capabilities are available, the client offers the option to list its tools in the Tools tab. Listing the prompts and resources available with the server has not been implemented yet (these tabs provide no content). 

Once the list of tools are available, the user can choose to call any of the tools by entering the required input parameters in the *Run* panel. 

As the tool is executed (through the server), the user can inspect the responses in the *Inspect* panel. 

PS: If this seems similar to the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), it's not a coincidence. This project borrows a lot from it while maintaining as much simplicity as possible.  


