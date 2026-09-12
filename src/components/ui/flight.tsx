// Consumer-path shim: registry blocks import "@/components/ui/flight" exactly
// as installed projects do, while the site sources live in src/registry.
export * from "@/registry/flight";
