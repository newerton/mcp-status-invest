import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { StatusInvestService } from './application/services/StatusInvestService.js';
import { StatusInvestApiService } from './infrastructure/services/StatusInvestApiService.js';
import { StatusInvestToolsController } from './interface/controllers/StatusInvestToolsController.js';

async function main() {
  // Criação da instância do servidor MCP
  const server = new McpServer({
    name: 'weather',
    version: '1.0.0',
    capabilities: {
      resources: {},
      tools: {},
    },
  });

  // Inicializando serviços e controladores
  const apiService = new StatusInvestApiService();
  const service = new StatusInvestService(apiService);

  // Controlador que registra as ferramentas
  new StatusInvestToolsController(server, service);

  // Configurando e iniciando o servidor
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Status Invest MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
