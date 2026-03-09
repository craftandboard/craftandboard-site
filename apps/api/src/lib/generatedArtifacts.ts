import { filesystemArtifactStorage, GENERATED_ARTIFACTS_DIR } from "./artifactStorage.js";

export { GENERATED_ARTIFACTS_DIR };

export async function writeBatchArtifactFile(input: {
  batchId: string;
  fileName: string;
  bytes: Buffer;
}) {
  return filesystemArtifactStorage.writeBatchFile(input);
}

export async function writeBatchArtifactPdf(input: {
  batchId: string;
  fileName: string;
  bytes: Buffer;
}) {
  return writeBatchArtifactFile(input);
}

export async function writeOrderArtifactPdf(input: {
  orderId: string;
  fileName: string;
  bytes: Buffer;
}) {
  return filesystemArtifactStorage.writeOrderFile(input);
}

export async function writeRemnantArtifactPdf(input: {
  remnantId: string;
  fileName: string;
  bytes: Buffer;
}) {
  return filesystemArtifactStorage.writeRemnantFile(input);
}
