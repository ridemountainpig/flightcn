import { InstallCommandCopy } from "@/components/home/install-command-copy";

export function InstallSnippet({ item }: { item: string }) {
  return <InstallCommandCopy item={item} className="mt-6 border-orange-200" />;
}
