import type { StorefrontDestinationZone, StorefrontShippingDestination } from "./types.js";

const westStates = new Set(["CA", "OR", "WA", "NV", "AZ"]);
const mountainStates = new Set(["CO", "ID", "MT", "UT", "WY", "NM"]);
const centralStates = new Set([
  "TX",
  "OK",
  "KS",
  "NE",
  "SD",
  "ND",
  "MN",
  "IA",
  "MO",
  "AR",
  "LA",
  "WI",
  "IL",
  "MI",
  "IN",
  "OH"
]);
const eastStates = new Set([
  "AL",
  "CT",
  "DE",
  "FL",
  "GA",
  "KY",
  "MA",
  "MD",
  "ME",
  "MS",
  "NC",
  "NH",
  "NJ",
  "NY",
  "PA",
  "RI",
  "SC",
  "TN",
  "VA",
  "VT",
  "WV",
  "DC"
]);
const remoteStates = new Set(["AK", "HI"]);

export function normalizeShippingDestination(input: StorefrontShippingDestination): StorefrontShippingDestination {
  return {
    postalCode: input.postalCode.trim().toUpperCase(),
    countryCode: input.countryCode.trim().toUpperCase(),
    stateOrProvinceCode: input.stateOrProvinceCode.trim().toUpperCase(),
    city: input.city?.trim() || null,
    residentialIndicator: input.residentialIndicator ?? null
  };
}

export function resolveDestinationZone(destination: StorefrontShippingDestination): StorefrontDestinationZone {
  if (destination.countryCode !== "US") {
    return "UNSUPPORTED";
  }

  if (remoteStates.has(destination.stateOrProvinceCode)) {
    return "REMOTE";
  }
  if (westStates.has(destination.stateOrProvinceCode)) {
    return "WEST";
  }
  if (destination.stateOrProvinceCode === "CA") {
    return "LOCAL_WEST";
  }
  if (mountainStates.has(destination.stateOrProvinceCode)) {
    return "MOUNTAIN";
  }
  if (centralStates.has(destination.stateOrProvinceCode)) {
    return "CENTRAL";
  }
  if (eastStates.has(destination.stateOrProvinceCode)) {
    return "EAST";
  }

  return "UNSUPPORTED";
}
