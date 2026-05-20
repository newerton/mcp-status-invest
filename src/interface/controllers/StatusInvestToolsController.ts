import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import dayjs from 'dayjs';
import { z } from 'zod/v3';

import type { StatusInvestService } from '../../application/services/StatusInvestService.js';
import type { GetPaymentDatesInput } from '../../domain/models/StatusInvestServiceModel.js';

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
    this.registerGetFiiIndicatorsToolHandler();
    this.registerGetFiagroIndicatorsToolHandler();
    this.registerGetFiiInfraIndicatorsToolHandler();
    this.registerGetAllFundsToolHandler();
    this.registerPortfolioAnalysisToolHandler();
  }

  private registerGetStockToolHandler(): void {
    this.server.tool(
      'get-acoes',
      'Buscar informações básicas de ações',
      {
        stocks: z.array(z.string()).describe('Array of stock symbols'),
      },
      async (args) => {
        const stocks: string[] = Array.isArray(args.stocks)
          ? args.stocks
          : [args.stocks];

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
      async (args) => {
        const stocks: string[] = Array.isArray(args.stocks)
          ? args.stocks
          : [args.stocks];

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
        stocks: z
          .array(
            z.string().regex(/^[A-Z]{4}(3|4|11)$/, {
              message:
                'Código de ação inválido. Deve seguir o padrão: 4 letras + 3, 4 ou 11.',
            }),
          )
          .optional()
          .describe('Ação'),
      },
      async (args) => {
        const paymentDatesInput = args as GetPaymentDatesInput;
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

  private registerGetFiiIndicatorsToolHandler(): void {
    this.server.tool(
      'get-fiis',
      'Buscar indicadores fundamentalistas de FIIs (Fundos Imobiliários)',
      {
        tickers: z
          .array(z.string())
          .describe('Array of FII tickers (e.g., ["MXRF11", "BTLG11"])'),
      },
      async (args) => {
        const tickers: string[] = Array.isArray(args.tickers)
          ? args.tickers
          : [args.tickers];

        const infos = await this.service.getFiiIndicators(tickers);

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

  private registerGetFiagroIndicatorsToolHandler(): void {
    this.server.tool(
      'get-fiagros',
      'Buscar indicadores fundamentalistas de FIAgros (Fundos de Investimento nas Cadeias Produtivas Agroindustriais)',
      {
        tickers: z
          .array(z.string())
          .describe('Array of FIAgro tickers (e.g., ["VGIA11", "KNCA11"])'),
      },
      async (args) => {
        const tickers: string[] = Array.isArray(args.tickers)
          ? args.tickers
          : [args.tickers];

        const infos = await this.service.getFiagroIndicators(tickers);

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

  private registerGetFiiInfraIndicatorsToolHandler(): void {
    this.server.tool(
      'get-fii-infra',
      'Buscar indicadores fundamentalistas de FII-Infra (Fundos de Investimento em Infraestrutura)',
      {
        tickers: z
          .array(z.string())
          .describe(
            'Array of FII-Infra tickers (e.g., ["IFRA11", "KDIF11", "BDIF11"])',
          ),
      },
      async (args) => {
        const tickers: string[] = Array.isArray(args.tickers)
          ? args.tickers
          : [args.tickers];

        const infos = await this.service.getFiiInfraIndicators(tickers);

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

  private registerGetAllFundsToolHandler(): void {
    this.server.tool(
      'get-fundos-imobiliarios',
      'Buscar indicadores de FIIs, FIAgros e FII-Infra automaticamente. A tool identifica o tipo de cada ticker e retorna os dados consolidados. Use esta tool para buscar múltiplos tickers sem se preocupar com a classificação.',
      {
        tickers: z
          .array(z.string())
          .describe(
            'Array of fund tickers - can be FII, FIAgro or FII-Infra (e.g., ["MXRF11", "VGIA11", "IFRA11", "BTLG11"])',
          ),
      },
      async (args) => {
        const tickers: string[] = Array.isArray(args.tickers)
          ? args.tickers
          : [args.tickers];

        try {
          // Usa o novo método que tenta cada ticker nas 3 URLs e salva HTMLs
          const { results, debugInfo, debugDir } =
            await this.service.getAllFundsWithDebug(tickers);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    total: results.length,
                    tickers: tickers,
                    found: results.map((r) => r.ticker),
                    notFound: tickers.filter(
                      (t) =>
                        !results.some(
                          (r) => r.ticker.toUpperCase() === t.toUpperCase(),
                        ),
                    ),
                    data: results,
                    debug: {
                      htmlSavedTo: debugDir,
                      tickerAttempts: debugInfo,
                    },
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        } catch (error) {
          console.error('Error fetching fund indicators:', error);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
      },
    );
  }

  private registerPortfolioAnalysisToolHandler(): void {
    this.server.tool(
      'analise-carteira',
      'Análise completa de carteira com rebalanceamento multifatorial',
      {
        stocks: z
          .array(z.string())
          .describe('Array of stock symbols (e.g., ["BBAS3", "ITUB3"])'),
        totalAmount: z
          .number()
          .describe('Total amount available to invest in BRL'),
        orderCost: z.number().describe('Cost per order in BRL'),
        strategy: z
          .string()
          .optional()
          .describe(
            'Investment strategy (buy-and-hold, dividend-focused, etc.)',
          ),
      },
      async (args) => {
        try {
          const {
            stocks,
            totalAmount,
            orderCost,
            strategy = 'buy-and-hold',
          } = args;

          const stocksArray: string[] = Array.isArray(stocks)
            ? stocks
            : typeof stocks === 'string'
              ? [stocks]
              : [];

          const [basicInfo, indicators] = await Promise.all([
            this.service.getStockResume(stocksArray),
            this.service.getStockIndicators(stocksArray),
          ]);

          const portfolioData = {
            strategy,
            totalAmount,
            orderCost,
            stocks: stocks.map((_ticker: string, index: number) => {
              const stock = indicators[index];
              const basic = basicInfo[index];
              return {
                ticker: stock.stock,
                name: basic.name,
                price: basic.price,
                data: stock,
              };
            }),
            basicInfo,
            indicators,
            timestamp: new Date().toISOString(),
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(portfolioData, null, 2),
              },
            ],
          };
        } catch (error) {
          console.error('Portfolio analysis error:', error);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Unknown error occurred during portfolio analysis',
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }
      },
    );
  }
}
