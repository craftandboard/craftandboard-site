import path from "node:path";
import { prisma } from "../../lib/prisma.js";
import { filesystemArtifactStorage } from "../../lib/artifactStorage.js";
import { env } from "../../lib/env.js";
import { LOCAL_ORG_ID } from "../settings/service.js";

export type CncWatchFolderFormat = "csv" | "mosaic" | "json";

const artifactTypeByFormat: Record<CncWatchFolderFormat, "batch-cnc-csv" | "batch-cnc-mosaic" | "batch-cnc-json"> = {
  csv: "batch-cnc-csv",
  mosaic: "batch-cnc-mosaic",
  json: "batch-cnc-json"
};

export async function deliverBatchCncToWatchFolder(
  batchId: string,
  format: CncWatchFolderFormat,
  organizationId = LOCAL_ORG_ID
): Promise<{
  batchId: string;
  format: CncWatchFolderFormat;
  artifact: {
    type: "batch-cnc-csv" | "batch-cnc-mosaic" | "batch-cnc-json";
    uri: string;
    version: number;
  };
  delivery: {
    target: "watch-folder";
    path: string;
  };
}> {
  if (!env.CNC_WATCH_FOLDER_PATH) {
    throw new Error("CNC watch folder is not configured.");
  }

  const artifactType = artifactTypeByFormat[format];
  const batch = await prisma.batch.findFirst({
    where: {
      id: batchId,
      organizationId
    },
    include: {
      artifacts: {
        where: {
          type: artifactType,
          isCurrent: true
        },
        orderBy: [{ version: "desc" }],
        take: 1
      }
    }
  });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  const artifact = batch.artifacts[0];
  if (!artifact) {
    throw new Error(`Batch ${batch.code} does not have a current ${format.toUpperCase()} CNC artifact to deliver.`);
  }

  const sourcePath = filesystemArtifactStorage.resolveGeneratedFilePath(artifact.uri);
  const extension = path.extname(sourcePath) || (format === "json" ? ".json" : ".csv");
  const deliveryPath = await filesystemArtifactStorage.copyToDirectory({
    sourcePath,
    targetDirectory: env.CNC_WATCH_FOLDER_PATH,
    fileName: `${batch.code}-${format}-v${artifact.version}${extension}`
  });

  return {
    batchId,
    format,
    artifact: {
      type: artifact.type as "batch-cnc-csv" | "batch-cnc-mosaic" | "batch-cnc-json",
      uri: artifact.uri,
      version: artifact.version
    },
    delivery: {
      target: "watch-folder",
      path: deliveryPath
    }
  };
}
