// 특정 종목 주식 REST
export interface StockBasicInfo {
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