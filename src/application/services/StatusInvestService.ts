import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import voca from 'voca';

import { TypeEnum } from '../../domain/models/StatusInvestModel.js';
import {
  GetPaymentDatesInput,
  GetPaymentDatesOutput,
} from '../../domain/models/StatusInvestServiceModel.js';
import { StatusInvestApiService } from '../../infrastructure/services/StatusInvestApiService.js';

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
}
