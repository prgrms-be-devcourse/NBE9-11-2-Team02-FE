import { Suspense } from "react";
import type { Metadata } from "next";
import TradeSellClient from "./TradeSellClient";

export const metadata: Metadata = {
  title: "판매 | Together FE",
  description: "주식 판매 화면",
};

export default function TradeSellPage() {
  return (
    <Suspense>
      <TradeSellClient />
    </Suspense>
  );
}
