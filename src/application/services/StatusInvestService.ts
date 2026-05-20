import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import voca from 'voca';

import { TypeEnum } from '../../domain/models/StatusInvestModel.js';
import type {
  GetPaymentDatesInput,
  GetPaymentDatesOutput,
} from '../../domain/models/StatusInvestServiceModel.js';
import type { StatusInvestApiService } from '../../infrastructure/services/StatusInvestApiService.js';

dayjs.extend(customParseFormat);
export class StatusInvestService {
  constructor(private apiService: StatusInvestApiService) {}

  async getStockResume(stocks: string[]) {
    const data = [];
    for (const stock of stocks) {
      const stockData = await this.apiService.getStockResume(stock);
      if (stockData && stockData?.length > 0) {
        for (const item of stockData) {
          let type = TypeEnum[item.type];
          if (!type) {
            type = `${item.type} unknown`;
          }
          const jsonData = {
            id: item.id,
            type,
            code: item.code,
            name: item.name,
            price: item.price,
            variation: item.variation,
            variationUp: item.variationUp,
            url: item.url,
            image: `https://statusinvest.com.br/img/company/avatar/${item.parentId}.jpg?v=214`,
          };
          data.push(jsonData);
        }
      }
    }
    return data;
  }

  async getStockIndicators(stocks: string[]) {
    const baseUrl = this.apiService.getUrlBase();
    const stockData = [];
    for (const stock of stocks) {
      const response = await this.apiService.getIndicators(stock);
      if (!response) continue;

      const resume = this.getResume(response);
      const indicators = this.getAllIndicators(response);

      const data = {
        stock: stock,
        url: `${baseUrl}/acoes/${stock.toLowerCase()}`,
        resume: {
          price: {
            value: resume.price.value,
            variation: resume.price.variation,
          },
          min52weeks: {
            value: resume.min52Weeks.value,
          },
          max52weeks: {
            value: resume.max52Weeks.value,
          },
          minMonth: {
            value: resume.minMonth.value,
          },
          maxMonth: {
            value: resume.maxMonth.value,
          },
          valuation12Months: {
            value: resume.valuation12Months.value,
          },
          valuationCurrentMonth: {
            value: resume.valuationCurrentMonth.value,
          },
        },
        indicators,
      };

      stockData.push(data);
    }

    return stockData;
  }

  async getStockPaymentDates(paymentDatesInput: GetPaymentDatesInput) {
    const { initialDate, finalDate, stocks } = paymentDatesInput;

    if (!stocks || stocks.length === 0) {
      const response = await this.getDatesPayment(initialDate, finalDate);
      return response;
    }

    const data = [];
    for (const stock of stocks) {
      const response = await this.getDatesPayment(
        initialDate,
        finalDate,
        stock.toUpperCase(),
      );
      if (response && response.length > 0) {
        data.push(...response);
      }
    }

    return data;
  }

  private getResume(html: string) {
    const $ = cheerio.load(html);

    const priceText = $('div[title="Valor atual do ativo"] strong.value')
      .text()
      .trim();
    const price = parseFloat(
      priceText.replace('R$', '').replace('.', '').replace(',', '.'),
    );

    const variationText = $(
      'span[title="Variação do valor do ativo com base no dia anterior"] b',
    )
      .text()
      .trim();

    const variation = parseFloat(
      variationText.replace('%', '').replace(',', '.'),
    );

    const min52weeksText = $(
      'div[title="Valor mínimo das últimas 52 semanas"] strong.value',
    )
      .text()
      .trim();

    const min52weeks = parseFloat(
      min52weeksText.replace('R$', '').replace('.', '').replace(',', '.'),
    );

    const max52weeksText = $(
      'div[title="Valor máximo das últimas 52 semanas"] strong.value',
    )
      .text()
      .trim();

    const max52weeks = parseFloat(
      max52weeksText.replace('R$', '').replace('.', '').replace(',', '.'),
    );

    const minMonthText = $(
      'div[title="Valor mínimo do mês atual"] span.sub-value',
    )
      .text()
      .trim();
    const minMonth = parseFloat(
      minMonthText.replace('R$', '').replace('.', '').replace(',', '.'),
    );
    const maxMonthText = $(
      'div[title="Valor máximo do mês atual"] span.sub-value',
    )
      .text()
      .trim();
    const maxMonth = parseFloat(
      maxMonthText.replace('R$', '').replace('.', '').replace(',', '.'),
    );

    const valuation12MonthsText = $(
      'div[title="Valorização no preço do ativo com base nos últimos 12 meses"] strong.value',
    )
      .text()
      .trim();
    const valuation12Months = parseFloat(
      valuation12MonthsText
        .replace('R$', '')
        .replace('.', '')
        .replace(',', '.'),
    );

    const valuationCurrentMonthText = $(
      'div[title="Valorização no preço do ativo com base no mês atual"] span.sub-value b',
    )
      .text()
      .trim();
    const valuationCurrentMonth = parseFloat(
      valuationCurrentMonthText.replace('%', '').replace(',', '.'),
    );

    // Função auxiliar para converter NaN para null
    const toNullIfNaN = (value: number) => (Number.isNaN(value) ? null : value);

    return {
      price: {
        value: toNullIfNaN(price),
        variation: toNullIfNaN(variation),
      },
      min52Weeks: {
        value: toNullIfNaN(min52weeks),
      },
      max52Weeks: {
        value: toNullIfNaN(max52weeks),
      },
      minMonth: {
        value: toNullIfNaN(minMonth),
      },
      maxMonth: {
        value: toNullIfNaN(maxMonth),
      },
      valuation12Months: {
        value: toNullIfNaN(valuation12Months),
      },
      valuationCurrentMonth: {
        value: toNullIfNaN(valuationCurrentMonth),
      },
    };
  }

  private getAllIndicators(html: string) {
    const $ = cheerio.load(html);

    const indicatorContainer = $(
      'div.indicator-today-container > div > div.indicators',
    );

    if (indicatorContainer.length === 0) {
      return [];
    }

    if (indicatorContainer.length > 0) {
      const valuationIndicators = indicatorContainer.map((_, element) => {
        const title = $(element).find('strong.uppercase').text().trim();

        const indicatorsSection = $(element).find('.item');

        const values = indicatorsSection
          .map((_, item) => {
            const title = $(item).find('.title').text().trim();
            const value = $(item).find('.value').text().trim();
            return {
              title,
              value: parseFloat(value.replace(',', '.')),
            };
          })
          .get();

        return {
          title: voca.camelCase(title),
          values,
        };
      });

      return valuationIndicators.toArray();
    }
  }

  private async getDatesPayment(
    initialDate: string,
    finalDate: string,
    stock?: string,
  ): Promise<GetPaymentDatesOutput[]> {
    const baseUrl = this.apiService.getUrlBase();

    const paymentDatesInput = {
      initialDate,
      finalDate,
      stock,
    };

    const paymentDate =
      await this.apiService.getStockPaymentDates(paymentDatesInput);
    const datePayments = paymentDate?.datePayment;
    if (!datePayments || datePayments.length === 0) {
      return [];
    }

    const data = datePayments.map((item) => {
      return {
        code: item.code,
        companyName: item.companyName,
        price: parseFloat(item.resultAbsoluteValue.replace(',', '.')),
        dateCom: dayjs(item.dateCom, 'DD/MM/YYYY').format('YYYY-MM-DD'),
        paymentDate: dayjs(item.paymentDividend, 'DD/MM/YYYY').format(
          'YYYY-MM-DD',
        ),
        type: item.earningType,
        dy: item.dy,
        url: `${baseUrl}${item.uRLClear}`,
      };
    });

    return data;
  }

  async getFiiIndicators(tickers: string[]) {
    const baseUrl = this.apiService.getUrlBase();
    const fiiData = [];

    for (const ticker of tickers) {
      const response = await this.apiService.getFiiData(ticker);
      if (!response) continue;

      const resume = this.getResume(response);
      const indicators = this.extractFiiIndicators(response);
      const sector = this.extractFiiSector(response);

      const data = {
        ticker: ticker.toUpperCase(),
        type: 'FII',
        url: `${baseUrl}/fundos-imobiliarios/${ticker.toLowerCase()}`,
        sector,
        resume: {
          price: {
            value: resume.price.value,
            variation: resume.price.variation,
          },
          min52weeks: {
            value: resume.min52Weeks.value,
          },
          max52weeks: {
            value: resume.max52Weeks.value,
          },
          minMonth: {
            value: resume.minMonth.value,
          },
          maxMonth: {
            value: resume.maxMonth.value,
          },
          valuation12Months: {
            value: resume.valuation12Months.value,
          },
          valuationCurrentMonth: {
            value: resume.valuationCurrentMonth.value,
          },
        },
        indicators,
      };

      fiiData.push(data);
    }

    return fiiData;
  }

  async getFiagroIndicators(tickers: string[]) {
    const baseUrl = this.apiService.getUrlBase();
    const fiagroData = [];

    for (const ticker of tickers) {
      const response = await this.apiService.getFiagroData(ticker);
      if (!response) continue;

      const resume = this.getResume(response);
      const indicators = this.extractFiiIndicators(response);
      const sector = this.extractFiiSector(response);

      const data = {
        ticker: ticker.toUpperCase(),
        type: 'FIAGRO',
        url: `${baseUrl}/fiagros/${ticker.toLowerCase()}`,
        sector,
        resume: {
          price: {
            value: resume.price.value,
            variation: resume.price.variation,
          },
          min52weeks: {
            value: resume.min52Weeks.value,
          },
          max52weeks: {
            value: resume.max52Weeks.value,
          },
          minMonth: {
            value: resume.minMonth.value,
          },
          maxMonth: {
            value: resume.maxMonth.value,
          },
          valuation12Months: {
            value: resume.valuation12Months.value,
          },
          valuationCurrentMonth: {
            value: resume.valuationCurrentMonth.value,
          },
        },
        indicators,
      };

      fiagroData.push(data);
    }

    return fiagroData;
  }

  async getFiiInfraIndicators(tickers: string[]) {
    const baseUrl = this.apiService.getUrlBase();
    const fiiInfraData = [];

    for (const ticker of tickers) {
      const response = await this.apiService.getFiiInfraData(ticker);
      if (!response) continue;

      const resume = this.getResume(response);
      const indicators = this.extractFiiIndicators(response);
      const sector = this.extractFiiSector(response);

      const data = {
        ticker: ticker.toUpperCase(),
        type: 'FII-INFRA',
        url: `${baseUrl}/fiinfras/${ticker.toLowerCase()}`,
        sector,
        resume: {
          price: {
            value: resume.price.value,
            variation: resume.price.variation,
          },
          min52weeks: {
            value: resume.min52Weeks.value,
          },
          max52weeks: {
            value: resume.max52Weeks.value,
          },
          minMonth: {
            value: resume.minMonth.value,
          },
          maxMonth: {
            value: resume.maxMonth.value,
          },
          valuation12Months: {
            value: resume.valuation12Months.value,
          },
          valuationCurrentMonth: {
            value: resume.valuationCurrentMonth.value,
          },
        },
        indicators,
      };

      fiiInfraData.push(data);
    }

    return fiiInfraData;
  }

  private extractFiiSector(html: string): string {
    const $ = cheerio.load(html);

    // Busca pelo link que contém o segmento com arrow_forward (FIIs tradicionais)
    const sectorLink = $(
      'a[title*="Ver fundos imobiliários que fazem parte do segmento"] strong.value',
    )
      .text()
      .trim();

    if (sectorLink) return sectorLink;

    // Busca em divs com "Segmento ANBIMA" (FIIs)
    const sectorAnbima = $('h3:contains("Segmento ANBIMA")')
      .parent()
      .find('strong.value')
      .text()
      .trim();

    if (sectorAnbima) return sectorAnbima;

    // Busca em "SETOR DE ATUAÇÃO" (FIAgros)
    const sectorAtuacao = $('strong:contains("SETOR DE ATUAÇÃO")')
      .parent()
      .find('span')
      .first()
      .text()
      .trim();

    if (sectorAtuacao) return sectorAtuacao;

    // Busca por padrão "Segmento" com span.span-item (FII-Infra)
    const sectorSpanItem = $('strong:contains("Segmento")')
      .parent()
      .find('span.span-item')
      .text()
      .trim();

    if (sectorSpanItem) return sectorSpanItem;

    // Busca em sub-values
    const sectorSubValue = $('span.sub-value:contains("Setor")')
      .parent()
      .find('strong.value')
      .text()
      .trim();

    if (sectorSubValue) return sectorSubValue;

    return 'N/A';
  }

  private extractFiiIndicators(html: string) {
    const $ = cheerio.load(html);
    const indicators: Record<string, unknown> = {};

    // Lista de indicadores importantes para FIIs
    const indicatorMappings = [
      { key: 'dividendYield', labels: ['Dividend Yield', 'DY'] },
      { key: 'pvp', labels: ['P/VP'] },
      {
        key: 'valorPatrimonial',
        labels: ['Val. patrimonial p/cota', 'Valor Patrimonial'],
      },
      { key: 'valorEmCaixa', labels: ['Valor em caixa'] },
      { key: 'numeroCotas', labels: ['Nº cotas emitidas'] },
      { key: 'numeroCotistas', labels: ['Nº de Cotistas'] },
      { key: 'liquidezMediaDiaria', labels: ['Liquidez Diária'] },
      { key: 'rendimentoMensalMedio', labels: ['RENDIMENTO MENSAL MÉDIO'] },
      { key: 'participacaoIfix', labels: ['PARTICIPAÇÃO NO IFIX'] },
      { key: 'vacancia', labels: ['Vacância'] },
      { key: 'inadimplencia', labels: ['Inadimplência'] },
      { key: 'indexador', labels: ['Indexador'] },
    ];

    for (const mapping of indicatorMappings) {
      for (const label of mapping.labels) {
        // Busca o título e pega o valor do próximo strong.value
        const titleElement = $(`h3.title:contains("${label}")`).first();

        if (titleElement.length > 0) {
          // Remove os elementos filhos (como tooltips) e pega apenas o texto direto
          const titleClone = titleElement.clone();
          titleClone.find('i, span, small').remove();
          const cleanTitle = titleClone.text().trim();

          const container = titleElement.parent();
          const value = container.find('strong.value').text().trim();
          const icon = container.find('span.icon').text().trim();

          if (value) {
            indicators[mapping.key] = {
              title: cleanTitle,
              value: value,
              unit: icon || '',
            };
            break; // Encontrou, não precisa buscar outros labels
          }
        }
      }
    }

    // Busca por indicadores adicionais que podem estar em sub-values
    const subValueElements = $('span.sub-value').parent();
    subValueElements.each((_, el) => {
      const titleEl = $(el).find('span.sub-value');
      const titleClone = titleEl.clone();
      titleClone.find('span').remove();
      const title = titleClone.text().trim();

      const value = $(el).find('strong.value').text().trim();

      // Filtrar indicadores inválidos ou vazios
      const invalidTitles = ['help_outline', '', ' '];
      const invalidValues = ['', ' ', '-'];

      if (
        title &&
        value &&
        !invalidTitles.includes(title) &&
        !invalidValues.includes(value) &&
        !Object.values(indicators).some(
          (ind) => (ind as { title: string }).title === title,
        )
      ) {
        const key = voca.camelCase(title);
        indicators[key] = {
          title: title,
          value: value,
          unit: '',
        };
      }
    });

    return indicators;
  }

  async getAllFundsWithDebug(tickers: string[]) {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const baseUrl = this.apiService.getUrlBase();

    // Criar diretório de debug se não existir
    const debugDir = path.join(process.cwd(), 'src', 'debug', 'html');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    const results = [];
    const debugInfo: unknown[] = [];

    for (const ticker of tickers) {
      let found = false;
      const tickerDebug = {
        found: false,
        foundIn: null as string | null,
        ticker: ticker.toUpperCase(),
        attempts: [] as Array<{
          type: string;
          url: string;
          status: string;
          htmlSize?: number;
          htmlPath?: string;
          error?: string;
        }>,
      };

      // Tentativa 1: FII tradicional
      try {
        const htmlFii = await this.apiService.getFiiData(ticker);
        const htmlPath = path.join(
          debugDir,
          `${ticker.toUpperCase()}_fii.html`,
        );

        if (htmlFii) {
          fs.writeFileSync(htmlPath, htmlFii);
          tickerDebug.attempts.push({
            type: 'FII',
            url: `${baseUrl}/fundos-imobiliarios/${ticker.toLowerCase()}`,
            status: 'success',
            htmlSize: htmlFii.length,
            htmlPath,
          });

          // Tentar extrair dados
          const resume = this.getResume(htmlFii);
          const indicators = this.extractFiiIndicators(htmlFii);
          const sector = this.extractFiiSector(htmlFii);

          // Verificar se tem dados válidos (não NaN e não null)
          const hasValidPrice =
            resume.price.value !== null && !Number.isNaN(resume.price.value);
          const hasValidIndicators = Object.keys(indicators).length > 0;

          if (hasValidPrice || hasValidIndicators) {
            results.push({
              ticker: ticker.toUpperCase(),
              type: 'FII',
              url: `${baseUrl}/fundos-imobiliarios/${ticker.toLowerCase()}`,
              sector,
              resume: {
                price: {
                  value: resume.price.value,
                  variation: resume.price.variation,
                },
                min52weeks: { value: resume.min52Weeks.value },
                max52weeks: { value: resume.max52Weeks.value },
                minMonth: { value: resume.minMonth.value },
                maxMonth: { value: resume.maxMonth.value },
                valuation12Months: { value: resume.valuation12Months.value },
                valuationCurrentMonth: {
                  value: resume.valuationCurrentMonth.value,
                },
              },
              indicators,
            });
            found = true;
            tickerDebug.found = true;
            tickerDebug.foundIn = 'FII';
          }
        }
      } catch (error: unknown) {
        tickerDebug.attempts.push({
          type: 'FII',
          url: `${baseUrl}/fundos-imobiliarios/${ticker.toLowerCase()}`,
          status: 'error',
          error: (error as Error).message,
        });
      }

      // Tentativa 2: FIAgro (se ainda não encontrou)
      if (!found) {
        try {
          const htmlFiagro = await this.apiService.getFiagroData(ticker);
          const htmlPath = path.join(
            debugDir,
            `${ticker.toUpperCase()}_fiagro.html`,
          );

          if (htmlFiagro) {
            fs.writeFileSync(htmlPath, htmlFiagro);
            tickerDebug.attempts.push({
              type: 'FIAGRO',
              url: `${baseUrl}/fiagros/${ticker.toLowerCase()}`,
              status: 'success',
              htmlSize: htmlFiagro.length,
              htmlPath,
            });

            const resume = this.getResume(htmlFiagro);
            const indicators = this.extractFiiIndicators(htmlFiagro);
            const sector = this.extractFiiSector(htmlFiagro);

            // Verificar se tem dados válidos (não NaN e não null)
            const hasValidPrice =
              resume.price.value !== null && !Number.isNaN(resume.price.value);
            const hasValidIndicators = Object.keys(indicators).length > 0;

            if (hasValidPrice || hasValidIndicators) {
              results.push({
                ticker: ticker.toUpperCase(),
                type: 'FIAGRO',
                url: `${baseUrl}/fiagros/${ticker.toLowerCase()}`,
                sector,
                resume: {
                  price: {
                    value: resume.price.value,
                    variation: resume.price.variation,
                  },
                  min52weeks: { value: resume.min52Weeks.value },
                  max52weeks: { value: resume.max52Weeks.value },
                  minMonth: { value: resume.minMonth.value },
                  maxMonth: { value: resume.maxMonth.value },
                  valuation12Months: { value: resume.valuation12Months.value },
                  valuationCurrentMonth: {
                    value: resume.valuationCurrentMonth.value,
                  },
                },
                indicators,
              });
              found = true;
              tickerDebug.found = true;
              tickerDebug.foundIn = 'FIAGRO';
            }
          }
        } catch (error: unknown) {
          tickerDebug.attempts.push({
            type: 'FIAGRO',
            url: `${baseUrl}/fiagros/${ticker.toLowerCase()}`,
            status: 'error',
            error: (error as Error).message,
          });
        }
      }

      // Tentativa 3: FII-Infra (se ainda não encontrou)
      if (!found) {
        try {
          const htmlFiiInfra = await this.apiService.getFiiInfraData(ticker);
          const htmlPath = path.join(
            debugDir,
            `${ticker.toUpperCase()}_fiiinfra.html`,
          );

          if (htmlFiiInfra) {
            fs.writeFileSync(htmlPath, htmlFiiInfra);
            tickerDebug.attempts.push({
              type: 'FII-INFRA',
              url: `${baseUrl}/fiinfras/${ticker.toLowerCase()}`,
              status: 'success',
              htmlSize: htmlFiiInfra.length,
              htmlPath,
            });

            const resume = this.getResume(htmlFiiInfra);
            const indicators = this.extractFiiIndicators(htmlFiiInfra);
            const sector = this.extractFiiSector(htmlFiiInfra);

            // Verificar se tem dados válidos (não NaN e não null)
            const hasValidPrice =
              resume.price.value !== null && !Number.isNaN(resume.price.value);
            const hasValidIndicators = Object.keys(indicators).length > 0;

            if (hasValidPrice || hasValidIndicators) {
              results.push({
                ticker: ticker.toUpperCase(),
                type: 'FII-INFRA',
                url: `${baseUrl}/fiinfras/${ticker.toLowerCase()}`,
                sector,
                resume: {
                  price: {
                    value: resume.price.value,
                    variation: resume.price.variation,
                  },
                  min52weeks: { value: resume.min52Weeks.value },
                  max52weeks: { value: resume.max52Weeks.value },
                  minMonth: { value: resume.minMonth.value },
                  maxMonth: { value: resume.maxMonth.value },
                  valuation12Months: { value: resume.valuation12Months.value },
                  valuationCurrentMonth: {
                    value: resume.valuationCurrentMonth.value,
                  },
                },
                indicators,
              });
              found = true;
              tickerDebug.found = true;
              tickerDebug.foundIn = 'FII-INFRA';
            }
          }
        } catch (error: unknown) {
          tickerDebug.attempts.push({
            type: 'FII-INFRA',
            url: `${baseUrl}/fiinfras/${ticker.toLowerCase()}`,
            status: 'error',
            error: (error as Error).message,
          });
        }
      }

      tickerDebug.found = found;
      debugInfo.push(tickerDebug);
    }

    return {
      results: results.sort((a, b) => a.ticker.localeCompare(b.ticker)),
      debugInfo,
      debugDir,
    };
  }
}
