import { TypeEnum } from '../../domain/models/StatusInvest.js';
import { StatusInvestApiService } from '../../infrastructure/services/StatusInvestApiService.js';

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
    return this.apiService.getIndicators(stocks);
  }
}
