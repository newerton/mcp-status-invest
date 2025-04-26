<div align="center">

# Status Invest - MCP Server

This project is part of the Model Context Protocol (MCP) ecosystem and provides tools to interact with external APIs and manage specific domain models. It is designed to demonstrate how to build an MCP server with external API integration and data validation.

</div>

<table style="border-collapse: collapse; width: 100%; table-layout: fixed;">
<tr>
<td style="width: 40%; padding: 15px; vertical-align: middle; border: none;">An integration that enables MCP tools to query stock market data, such as stock prices, indicators, and payment dates, using the Status Invest API.</td>
<td style="width: 60%; padding: 0; vertical-align: middle; border: none; min-width: 300px; text-align: center;"><a href="https://glama.ai/mcp/servers/@newerton/mcp-status-invest">
  <img style="max-width: 100%; height: auto; min-width: 300px;" src="https://glama.ai/mcp/servers/@newerton/mcp-status-invest/badge" alt="Status Invest - MCP Server" />
</a></td>
</tr>
</table>

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [MCP Server Configuration in VSCode](#mcp-server-configuration-in-vscode)
- [MCP Server Output in VSCode](#mcp-server-output-in-vscode)
- [Contribution](#contribution)
- [License](#license)

## Features

- **get-acoes**: Fetch basic stock information.
- **get-indicadores**: Fetch detailed stock indicator information.
- **get-acoes-datas-pagamento**: Fetch stock payment dates.
- Input validation using [Zod](https://github.com/colinhacks/zod).
- Integration with the Status Invest API using `fetch` (infrastructure layer).

## Architecture

The project follows a layered architecture inspired by **Domain-Driven Design** (DDD) patterns:

- **Domain** (`src/domain`):
  Defines interfaces and types that represent data structures (e.g., `StatusInvest`).

- **Infrastructure** (`src/infrastructure`):
  Implements external services, such as `StatusInvestApiService`, responsible for making HTTP calls to the Status Invest API.

- **Application** (`src/application`):
  Contains business logic in `StatusInvestService`, which processes and formats data from the infrastructure.

- **Interface** (`src/interface`):
  Includes controllers (`StatusInvestToolsController`) that register tools in the MCP server, define validation schemas, and return results.

- **Entry Point** (`src/main.ts`):
  Initializes the `McpServer`, configures the transport (`StdioServerTransport`), instantiates services and controllers, and starts listening on _stdio_.

The folder structure is as follows:
```
src/
├── domain/
│   └── models/           # Domain interfaces
├── infrastructure/
│   └── services/         # External API implementations (Status Invest)
├── application/
│   └── services/         # Business logic and data formatting
├── interface/
│   └── controllers/      # MCP tool registration and validation
└── main.ts               # Server entry point
build/                    # Compiled JavaScript code
.vscode/                  # Contains the mcp.json file, MCP Server config
```

## Installation

```bash
git clone git@github.com:newerton/mcp-status-invest.git
cd mcp-status-invest
npm install
npm run build
```

## MCP Server Configuration in VSCode

1. Press `Ctrl+Shift+P` and select "MCP: List Servers"
2. Select "stocks" and then "Start Server"

## MCP Server Output in VSCode

1. Press `Ctrl+Shift+P` and select "MCP: List Servers"
2. Select "stocks" and then "Show Output"

## Contribution

Pull requests are welcome! Feel free to open issues and discuss improvements.

## License

This project is licensed under the Mozilla Public License 2.0 - see the [LICENSE](https://github.com/newerton/mcp-status-invest/blob/main/LICENSE) file for details.

