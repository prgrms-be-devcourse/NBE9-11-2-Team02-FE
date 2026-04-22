// 특정 종목 주식 REST
export interface StockBasicInfo {
  stockId: number;
  stockCode: string;
  stockName: string;
}

// 특정 종목 주식 SSE
export interface StockPriceInfo {
  price: string;
  changeSign: string;
  change: string;
  changeRate: string;
  tradeTime: string;
}

// 종목 차트 
export interface CandleRes {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartRes {
  stockCode: string;
  name: string;
  period: string;
  interval: string;
  candles: CandleRes[];
}