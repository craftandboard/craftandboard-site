import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeRawFixtureOrder } from "../imports/normalizers.js";
import { persistNormalizedOrders } from "./persistOrders.js";

async function resolveFixturesDirectory() {
  const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), "src/fixtures/orders"),
    path.join(moduleDirectory, "../../fixtures/orders"),
    path.join(moduleDirectory, "../../../src/fixtures/orders")
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error("Fixture order directory could not be resolved.");
}

export async function loadFixtureOrdersFromDisk() {
  const fixturesDirectory = await resolveFixturesDirectory();
  const files = (await fs.readdir(fixturesDirectory))
    .filter((file) => file.endsWith(".json"))
    .sort();

  const results = [];

  for (const file of files) {
    const rawContent = await fs.readFile(path.join(fixturesDirectory, file), "utf-8");
    results.push(
      normalizeRawFixtureOrder(JSON.parse(rawContent), {
        sourceFile: file
      })
    );
  }

  return results;
}

export async function importFixtureOrders(organizationId?: string) {
  const normalizedOrders = await loadFixtureOrdersFromDisk();
  const persisted = await persistNormalizedOrders(normalizedOrders, organizationId);

  return {
    fixtureFiles: normalizedOrders.length,
    ...persisted
  };
}
