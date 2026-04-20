"use client";

import { useState } from "react";

import { AirportSearchSection } from "@/components/home/airport-search-section";
import { HeroSection } from "@/components/home/hero-section";
import { ShowcaseSection } from "@/components/home/showcase-section";
import type { ProductKey } from "@/components/product-switcher";

export function HomeExperience() {
  const [product, setProduct] = useState<ProductKey>("flight");

  return (
    <>
      <HeroSection product={product} onProductChange={setProduct} />
      <ShowcaseSection product={product} />
      {product === "flight" ? <AirportSearchSection /> : null}
    </>
  );
}
