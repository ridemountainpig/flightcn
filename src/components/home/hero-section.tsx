"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";

import { InstallCommandCopy } from "@/components/home/install-command-copy";
import { SatelliteCommandCopy } from "@/components/home/satellite-command-copy";
import {
  heroCopy,
  installCommandByProduct,
} from "@/components/home/home-config";
import {
  ProductSwitcher,
  type ProductKey,
} from "@/components/product-switcher";

export function HeroSection({
  product,
  onProductChange,
}: {
  product: ProductKey;
  onProductChange: (next: ProductKey) => void;
}) {
  const copy = heroCopy[product];
  const installCommand = installCommandByProduct[product];
  const CommandCopy =
    product === "satellite" ? SatelliteCommandCopy : InstallCommandCopy;

  return (
    <motion.section
      className="px-0 py-12 text-center sm:px-8 sm:py-16"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      <motion.div
        className="flex h-fit flex-wrap items-center justify-center gap-1.5 px-4 pb-4 sm:gap-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
      >
        <Image
          src="/flightcn-icon.png"
          alt="flightcn icon"
          width={20}
          height={20}
          className="w-4 sm:w-5"
        />
        <p className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase sm:text-[11px] sm:tracking-[0.2em]">
          {copy.eyebrow}
        </p>
        <Image
          src="/mapcn-icon.svg"
          alt="mapcn icon"
          width={20}
          height={20}
          className="w-4 sm:w-5"
        />
      </motion.div>

      <motion.div
        className="mt-2 flex justify-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
      >
        <ProductSwitcher value={product} onChange={onProductChange} />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={product}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <h1 className="mx-auto mt-6 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            {copy.title}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl px-4 text-sm leading-7 text-slate-600 sm:mt-5 sm:px-0 sm:text-xl sm:leading-8">
            {copy.subtitle}
          </p>
          <CommandCopy
            command={installCommand}
            className="mx-auto mt-8 w-full max-w-2xl backdrop-blur-sm lg:max-w-152"
          />
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="mt-7 grid w-full gap-2.5 px-4 sm:mx-auto sm:max-w-md sm:grid-cols-2 sm:gap-3 sm:px-0"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
      >
        <motion.a
          href="#showcase"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
        >
          {copy.ctaPrimary}
          <Send className="size-4" />
        </motion.a>
        <motion.div
          className="w-full"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href={product === "satellite" ? "/docs/satellite" : "/docs/flight"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/75 px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white"
          >
            <Sparkles className="size-4" />
            {copy.ctaSecondary}
          </Link>
        </motion.div>
      </motion.div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 text-sm text-slate-600">
        <Link href="/docs/flight" className="hover:text-slate-950">
          Flight Docs
        </Link>
        <Link href="/docs/satellite" className="hover:text-slate-950">
          Satellite Docs
        </Link>
        <Link href="/docs/install/flight" className="hover:text-slate-950">
          Flight Install
        </Link>
        <Link href="/docs/install/satellite" className="hover:text-slate-950">
          Satellite Install
        </Link>
      </div>
    </motion.section>
  );
}
