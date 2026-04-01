import type { Metadata } from "next";

import { ComponentDocsPage } from "@/components/docs/component-docs-page";

export const metadata: Metadata = {
  title: "Documentation",
  description: "API reference and live component previews for flightcn.",
};

export default function DocsPage() {
  return <ComponentDocsPage />;
}
