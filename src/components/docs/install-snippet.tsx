import { InstallCommandCopy } from "@/components/home/install-command-copy";

export function InstallSnippet({ command }: { command: string }) {
  return (
    <InstallCommandCopy
      command={command}
      className="mt-6 border-orange-200 bg-orange-50/50"
    />
  );
}
