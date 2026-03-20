"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCraftBoardOutreachActivity,
  createCraftBoardOutreachTarget,
  updateCraftBoardOutreachTarget
} from "../../../../lib/api";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

function getStringList(formData: FormData, key: string) {
  return getString(formData, key)
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function toIsoDate(dateValue: string | null) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createOutreachTargetAction(formData: FormData) {
  const created = await createCraftBoardOutreachTarget({
    siteName: getString(formData, "siteName"),
    domain: getString(formData, "domain"),
    targetType: getString(formData, "targetType"),
    authorityTier: getString(formData, "authorityTier"),
    topicCluster: getString(formData, "topicCluster"),
    fitNotes: getString(formData, "fitNotes"),
    preferredAssetTypes: getStringList(formData, "preferredAssetTypes"),
    preferredCampaignKeys: getStringList(formData, "preferredCampaignKeys"),
    primaryContactName: getNullableString(formData, "primaryContactName"),
    primaryContactEmail: getNullableString(formData, "primaryContactEmail"),
    contactMethod: getNullableString(formData, "contactMethod"),
    notes: getNullableString(formData, "notes")
  });

  revalidatePath("/admin/craft-board/outreach");
  redirect(`/admin/craft-board/outreach/${created.targetId}`);
}

export async function updateOutreachTargetAction(formData: FormData) {
  const targetId = getString(formData, "targetId");
  const returnPath = getString(formData, "returnPath") || `/admin/craft-board/outreach/${targetId}`;

  await updateCraftBoardOutreachTarget({
    targetId,
    ...(formData.has("siteName") ? { siteName: getString(formData, "siteName") || undefined } : {}),
    ...(formData.has("domain") ? { domain: getString(formData, "domain") || undefined } : {}),
    ...(formData.has("targetType") ? { targetType: getString(formData, "targetType") || undefined } : {}),
    ...(formData.has("authorityTier") ? { authorityTier: getString(formData, "authorityTier") || undefined } : {}),
    ...(formData.has("topicCluster") ? { topicCluster: getString(formData, "topicCluster") || undefined } : {}),
    ...(formData.has("fitNotes") ? { fitNotes: getString(formData, "fitNotes") || undefined } : {}),
    ...(formData.has("preferredAssetTypes") ? { preferredAssetTypes: getStringList(formData, "preferredAssetTypes") } : {}),
    ...(formData.has("preferredCampaignKeys") ? { preferredCampaignKeys: getStringList(formData, "preferredCampaignKeys") } : {}),
    ...(formData.has("status") ? { status: getString(formData, "status") || undefined } : {}),
    ...(formData.has("primaryContactName") ? { primaryContactName: getNullableString(formData, "primaryContactName") } : {}),
    ...(formData.has("primaryContactEmail") ? { primaryContactEmail: getNullableString(formData, "primaryContactEmail") } : {}),
    ...(formData.has("contactMethod") ? { contactMethod: getNullableString(formData, "contactMethod") } : {}),
    ...(formData.has("nextFollowUpAt") ? { nextFollowUpAt: toIsoDate(getNullableString(formData, "nextFollowUpAt")) } : {}),
    ...(formData.has("notes") ? { notes: getNullableString(formData, "notes") } : {})
  });

  revalidatePath("/admin/craft-board/outreach");
  revalidatePath("/admin/craft-board/dashboard");
  revalidatePath("/admin/craft-board/seo/backlinks");
  redirect(returnPath);
}

export async function logOutreachActivityAction(formData: FormData) {
  const targetId = getString(formData, "targetId");
  const returnPath = getString(formData, "returnPath") || `/admin/craft-board/outreach/${targetId}`;

  await createCraftBoardOutreachActivity({
    targetId,
    activityType: getString(formData, "activityType"),
    campaignKey: getNullableString(formData, "campaignKey"),
    assetPageKey: getNullableString(formData, "assetPageKey"),
    note: getString(formData, "note"),
    outcome: getNullableString(formData, "outcome"),
    nextFollowUpAt: toIsoDate(getNullableString(formData, "nextFollowUpAt")),
    status: getNullableString(formData, "status")
  });

  revalidatePath("/admin/craft-board/outreach");
  revalidatePath("/admin/craft-board/dashboard");
  revalidatePath("/admin/craft-board/seo/backlinks");
  redirect(returnPath);
}
