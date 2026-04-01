"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";

import { InstallCommandCopy } from "@/components/home/install-command-copy";
import { installCommand } from "@/components/home/home-config";

export function HeroSection() {
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
          flightcn + mapcn
        </p>
        <Image
          src="/mapcn-icon.svg"
          alt="mapcn icon"
          width={20}
          height={20}
          className="w-4 sm:w-5"
        />
      </motion.div>
      <motion.h1
        className="mx-auto mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      >
        flightcn runs inside the mapcn ecosystem.
      </motion.h1>
      <motion.p
        className="mx-auto mt-4 max-w-3xl px-4 text-sm leading-7 text-slate-600 sm:mt-5 sm:px-0 sm:text-xl sm:leading-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      >
        Preview flight routes on live mapcn maps.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      >
        <InstallCommandCopy
          command={installCommand}
          className="mx-auto mt-8 w-full max-w-2xl backdrop-blur-sm lg:max-w-152"
        />
      </motion.div>
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
          Get Started
          <Send className="size-4" />
        </motion.a>
        <motion.div
          className="w-full"
          whileHover={{ y: -1.5 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/docs"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/75 px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-white"
          >
            <Sparkles className="size-4" />
            View Docs
          </Link>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
