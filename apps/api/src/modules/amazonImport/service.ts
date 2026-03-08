import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeAmazonFixture } from "./normalization.js";
import { persistAmazonOrders } from "./persistence.js";
import type { AmazonImportDiagnostic, AmazonImportPreview, AmazonImportResult } from "./types.js";

async function resolveFixturesDirectory() {
  const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(process.cwd(), "src/fixtures/amazon-seller-central"),
    path.join(moduleDirectory, "../../fixtures/amazon-seller-central"),
    path.join(moduleDirectory, "../../../src/fixtures/amazon-seller-central")
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error("Amazon fixture directory could not be resolved.");
}

async function loadAmazonFixtureFiles() {
  const fixturesDirectory = await resolveFixturesDirectory();

  return (await fs.readdir(fixturesDirectory))
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((fileName) => ({ fileName, fixturesDirectory }));
}

export async function previewAmazonFixtureImport(): Promise<AmazonImportPreview> {
  const files = await loadAmazonFixtureFiles();
  const warnings: AmazonImportDiagnostic[] = [];
  const errors: AmazonImportDiagnostic[] = [];
  const previews: AmazonImportPreview["previews"] = [];

  for (const file of files) {
    const raw = JSON.parse(
      await fs.readFile(path.join(file.fixturesDirectory, file.fileName), "utf-8")
    );

    try {
      const normalizedOrder = normalizeAmazonFixture(raw);
      previews.push({ fileName: file.fileName, normalizedOrder });
    } catch (error) {
      errors.push({
        fileName: file.fileName,
        amazonOrderId: raw.amazonOrderId,
        amazonOrderItemId: raw.amazonOrderItemId,
        severity: "error",
        message: error instanceof Error ? error.message : "Unknown import error"
      });
    }
  }

  return {
    filesProcessed: files.length,
    previews,
    warnings,
    errors
  };
}

export async function importAmazonFixtures(organizationId?: string): Promise<AmazonImportResult> {
  const preview = await previewAmazonFixtureImport();
  const persisted = await persistAmazonOrders(
    preview.previews.map((previewRow) => previewRow.normalizedOrder),
    organizationId
  );

  return {
    filesProcessed: preview.filesProcessed,
    warnings: preview.warnings,
    errors: preview.errors,
    ...persisted
  };
}
