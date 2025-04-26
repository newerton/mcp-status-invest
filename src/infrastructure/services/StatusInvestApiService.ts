import * as cheerio from 'cheerio';
import voca from 'voca';

import { MainSearchQuery } from '../../domain/models/StatusInvest.js';

export class StatusInvestApiService {
  private readonly API_BASE = 'https://statusinvest.com.br';
  private readonly USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

  // Helper function for making NWS API requests
  async makJsonRequest<T>(endpoint: string): Promise<T | null> {
    const url = `${this.API_BASE}${endpoint}`;
    const headers = {
      'User-Agent': this.USER_AGENT,
    };

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      console.error('Error making NWS request:', error);
      return null;
    }
  }

  async makeTextRequest<T>(endpoint: string): Promise<T | null> {
    const url = `${this.API_BASE}${endpoint}`;
    const headers = {
      'User-Agent': this.USER_AGENT,
    };

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.text()) as T;
    } catch (error) {
      console.error('Error making NWS request:', error);
      return null;
    }
  }
  async getStockResume(stock: string): Promise<MainSearchQuery[] | null> {
    const data = await this.makJsonRequest<MainSearchQuery[]>(
      `/home/mainsearchquery?q=${stock.toLowerCase()}`,
    );
    if (!data) return null;
    return data;
  }

  async getIndicators(stocks: string[]) {
    const stockData: Record<string, any> = [];

    for (const stock of stocks) {
      const html = await this.makeTextRequest<string>(
        `/acoes/${stock.toLowerCase()}`,
      );
      if (!html) continue;

      const resume = this.getResume(html);
      const indicators = this.getAllIndicators(html);

      const data = {
        stock: stock,
        url: `${this.API_BASE}/acoes/${stock.toLowerCase()}`,
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

  getResume(html: string) {
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

    return {
      price: {
        value: price,
        variation,
      },
      min52Weeks: {
        value: min52weeks,
      },
      max52Weeks: {
        value: max52weeks,
      },
      minMonth: {
        value: minMonth,
      },
      maxMonth: {
        value: maxMonth,
      },
      valuation12Months: {
        value: valuation12Months,
      },
      valuationCurrentMonth: {
        value: valuationCurrentMonth,
      },
    };
  }

  getAllIndicators(html: string) {
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
}
