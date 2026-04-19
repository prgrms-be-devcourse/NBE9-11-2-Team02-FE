import { Suspense } from "react";
import type { Metadata } from "next";
import TradeSellClient from "./TradeSellClient";

export const metadata: Metadata = {
  title: "구매 | Together FE",
  description: "주식 구매 화면",
};

export default function TradeBuyPage() {
  return (
    <Suspense>
      <TradeSellClient />
    </Suspense>
  );
}
