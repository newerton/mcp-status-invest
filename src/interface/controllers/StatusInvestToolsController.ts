import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import dayjs from 'dayjs';
import { z } from 'zod';

import { StatusInvestService } from '../../application/services/StatusInvestService.js';
import { GetPaymentDatesInput } from '../../domain/models/StatusInvestServiceModel.js';

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
    this.registerGetStockPaymentDatesToolHandler();
  }

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

  private registerGetStockPaymentDatesToolHandler(): void {
    this.server.tool(
      'get-acoes-datas-pagamento',
      'Buscar datas de pagamento de ações',
      {
        initialDate: z
          .string()
          .refine((date) => dayjs(date, 'YYYY-MM-DD', true).isValid(), {
            message: 'Data inicial inválida. Formato esperado: YYYY-MM-DD',
          })
          .describe('Data inicial'),
        finalDate: z
          .string()
          .refine((date) => dayjs(date, 'YYYY-MM-DD', true).isValid(), {
            message: 'Data final inválida. Formato esperado: YYYY-MM-DD',
          })
          .describe('Data final'),
        stock: z
          .array(
            z.string().regex(/^[A-Z]{4}(3|4|11)$/, {
              message:
                'Código de ação inválido. Deve seguir o padrão: 4 letras + 3, 4 ou 11.',
            }),
          )
          .optional()
          .describe('Ação'),
      },
      async (paymentDatesInput: GetPaymentDatesInput) => {
        const infos =
          await this.service.getStockPaymentDates(paymentDatesInput);

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
