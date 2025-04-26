export interface GetPaymentDatesInput {
  initialDate: string;
  finalDate: string;
  stocks?: string[];
}

export interface GetPaymentDatesOutput {
  code: string;
  companyName: string;
  price: number;
  dateCom: string;
  paymentDate: string;
  type: string;
  dy: string;
  url: string;
}
