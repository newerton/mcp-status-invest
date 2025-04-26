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
