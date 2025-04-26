import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { StatusInvestService } from '../../application/services/StatusInvestService.js';

export class StatusInvestToolsController {
  constructor(
    private server: McpServer,
    private service: StatusInvestService,
  ) {
    this.registerTools();
  }

  private registerTools() {
    this.registerGetStockToolHandler();
    this.registerGetIndicatorsToolHandler();
  }

  // async registerGetStockToolHandler() {
  //   const apiService = new StatusInvestApiService();
  //   const service = new StatusInvestService(apiService);
  //   const infos = await service.getStockInfo(['EGIE3']);
  //   return infos;
  // }

  private registerGetStockToolHandler(): void {
    this.server.tool(
      'get-acoes',
      'Buscar informações básicas de ações',
      {
        stocks: z.array(z.string()).describe('Array of stock symbols'),
      },
      async ({ stocks }) => {
        const infos = await this.service.getStockResume(stocks);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(infos, null, 2),
            },
          ],
        };
      },
    );
  }

  private registerGetIndicatorsToolHandler(): void {
    this.server.tool(
      'get-indicadores',
      'Buscar informações de indicadores de ações',
      {
        stocks: z.array(z.string()).describe('Array of stock symbols'),
      },
      async ({ stocks }) => {
        const infos = await this.service.getStockIndicators(stocks);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(infos, null, 2),
            },
          ],
        };
      },
    );
  }
}
