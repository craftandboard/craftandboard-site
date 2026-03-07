import type { NestingPartInput } from "@craft-and-board/shared";
import { buildNestingResult } from "../nesting/service.js";

export function buildNestingJob(input: {
  bundleCode: string;
  materialCode: NestingPartInput["materialCode"];
  parts: NestingPartInput[];
}) {
  return buildNestingResult(input);
}
