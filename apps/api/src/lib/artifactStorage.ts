import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
export const GENERATED_ARTIFACTS_DIR = path.resolve(MODULE_DIR, "../../../generated-artifacts");

export interface ArtifactStorage {
  writeBatchFile(input: { batchId: string; fileName: string; bytes: Buffer }): Promise<string>;
  writeOrderFile(input: { orderId: string; fileName: string; bytes: Buffer }): Promise<string>;
  resolveGeneratedFilePath(uri: string): string;
  copyToDirectory(input: { sourcePath: string; targetDirectory: string; fileName: string }): Promise<string>;
}

export const filesystemArtifactStorage: ArtifactStorage = {
  async writeBatchFile(input) {
    const batchDir = path.join(GENERATED_ARTIFACTS_DIR, "batches", input.batchId);
    await mkdir(batchDir, { recursive: true });

    const filePath = path.join(batchDir, input.fileName);
    await writeFile(filePath, input.bytes);

    return `/generated-artifacts/batches/${input.batchId}/${input.fileName}`;
  },

  async writeOrderFile(input) {
    const orderDir = path.join(GENERATED_ARTIFACTS_DIR, "orders", input.orderId);
    await mkdir(orderDir, { recursive: true });

    const filePath = path.join(orderDir, input.fileName);
    await writeFile(filePath, input.bytes);

    return `/generated-artifacts/orders/${input.orderId}/${input.fileName}`;
  },

  resolveGeneratedFilePath(uri) {
    const prefix = "/generated-artifacts/";
    if (!uri.startsWith(prefix)) {
      throw new Error("Artifact URI cannot be resolved from local storage.");
    }

    return path.join(GENERATED_ARTIFACTS_DIR, uri.slice(prefix.length));
  },

  async copyToDirectory(input) {
    await mkdir(input.targetDirectory, { recursive: true });
    const targetPath = path.join(input.targetDirectory, input.fileName);
    await copyFile(input.sourcePath, targetPath);
    return targetPath;
  }
};
