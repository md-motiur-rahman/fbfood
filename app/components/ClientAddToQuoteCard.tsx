"use client";

import React from "react";
import ProductCard, { type ProductCardProps } from "./ProductCard";
import { useQuote } from "./quote/QuoteContext";

export type ClientAddToQuoteCardProps = Omit<
  ProductCardProps,
  "onAdd" | "onWish"
> & {
  productname?: string; // optional alias for name when convenient
};

export default function ClientAddToQuoteCard(props: ClientAddToQuoteCardProps) {
  const { addItem } = useQuote();
  const { id, name, productname, img, available, badge, onDetailsHref } = props;
  const finalName = productname || name;

  function handleAdd() {
    if (!available) return;
    // Use `barcode` field expected by QuoteContext and /api/quotes
    addItem({ barcode: String(id), productname: finalName, picture: img }, 1);
  }

  return (
    <ProductCard
      id={id}
      name={finalName}
      img={img}
      badge={badge}
      available={available}
      onAdd={handleAdd}
      onDetailsHref={onDetailsHref}
    />
  );
}
