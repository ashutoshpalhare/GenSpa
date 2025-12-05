// Test-only stand-in for the `server-only` guard package. In Next.js the real package
// fails the build when server modules leak into client bundles; under Vitest (plain
// Node) that guard would throw on import, so the alias points here instead.
export {};
