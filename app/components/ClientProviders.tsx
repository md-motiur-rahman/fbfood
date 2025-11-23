"use client";

import React from "react";
import { QuoteProvider } from "./quote/QuoteContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <QuoteProvider>{children}</QuoteProvider>;
}
