export enum TypeEnum {
  'ação' = 1,
  'fii' = 2,
  'bdr' = 4,
  'etf' = 6,
  'stock' = 12,
  'fundos' = 15,
  'fii-infra' = 22,
  'fiagro' = 24,
  'cripto' = 100,
  'etf-exterior' = 901,
}

export interface MainSearchQuery {
  id: number;
  parentId: number;
  nameFormated: string;
  name: string;
  normalizedName: string;
  code: string;
  price: string;
  variation: string;
  variationUp: boolean;
  type: TypeEnum;
  url: string;
}

export interface GetEarnings {
  category: number;
  from: string;
  controller: string;
  close: boolean;
  dateCom: GetEarningsDateItem[];
  datePayment: GetEarningsDateItem[];
  provisioned: string[];
}

export interface GetEarningsDateItem {
  code: string;
  companyName: string;
  companyNameClean: string;
  companyId: number;
  resultAbsoluteValue: string;
  dateCom: string;
  paymentDividend: string;
  earningType: string;
  dy: string;
  recentEvents: number;
  recentReports: number;
  uRLClear: string;
  rankDateCom: number;
  rankPaymentDividend: number;
}
