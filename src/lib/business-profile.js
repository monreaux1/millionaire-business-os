import { base44 } from "@/api/base44Client";
import { accountStorage } from "@/lib/account-storage";

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

async function getCurrentOwnerEmail() {
  const user = await base44.auth.me();
  if (!user?.email) throw new Error("An authenticated account is required.");
  return user.email;
}

async function requireOwnedBusiness(businessId) {
  const ownerEmail = await getCurrentOwnerEmail();
  const businesses = await base44.entities.Business.filter(
    { id: businessId, created_by: ownerEmail },
    "-updated_date",
    1
  );
  const business = businesses?.[0] || null;
  if (!business) throw new Error("This business profile does not belong to the current account.");
  return business;
}

export async function getLatestBusinessProfile() {
  const ownerEmail = await getCurrentOwnerEmail();
  const businesses = await base44.entities.Business.filter(
    { created_by: ownerEmail },
    "-updated_date",
    1
  );
  return businesses?.[0] || null;
}

const businessToIntake = (business) => ({
  business_id: business.id,
  business_name: business.business_name,
  industry: business.industry,
  what: business.core_service,
  who: business.target_avatar,
  problem: business.primary_problem || business.biggest_challenge,
  result: business.customer_result || business.dream_outcome,
  current_revenue: business.current_revenue,
  desired_revenue: business.desired_revenue,
  business_stage: business.business_stage,
  acquisition_method: business.acquisition_method,
  existing_recurring_revenue: business.existing_recurring_revenue,
  tiers: business.offer_tiers,
  platform: business.deployment_platform,
});

export function mergeProfileIntoIntake(intake, business) {
  if (!business) return intake;

  return Object.entries(businessToIntake(business)).reduce((merged, [key, value]) => {
    if (!hasValue(merged[key]) && hasValue(value)) merged[key] = value;
    return merged;
  }, { ...intake });
}

export function syncBusinessProfileToBrowser(business) {
  if (!business || typeof window === "undefined") return;

  const applyProfile = (intake = {}) =>
    Object.entries(businessToIntake(business)).reduce((merged, [key, value]) => {
      if (hasValue(value)) merged[key] = value;
      return merged;
    }, { ...intake });

  try {
    const launchSystem = JSON.parse(accountStorage.getItem("launchSystem") || "null");
    if (launchSystem?.result) {
      accountStorage.setItem("launchSystem", JSON.stringify({
        ...launchSystem,
        business_id: business.id,
        profile_version: 2,
        intake: applyProfile(launchSystem.intake),
      }));
    }

    const draft = JSON.parse(accountStorage.getItem("ideaIntakeDraft") || "null");
    if (draft?.intake) {
      accountStorage.setItem("ideaIntakeDraft", JSON.stringify({
        ...draft,
        intake: applyProfile(draft.intake),
      }));
    }
  } catch (error) {
    console.warn("Browser profile bridge could not be refreshed:", error);
  }
}

export function buildBusinessProfilePayload(intake, launchResult) {
  const payload = {
    business_name: intake.business_name?.trim() || intake.what?.trim(),
    industry: intake.industry?.trim() || "Not specified",
    target_avatar: intake.who?.trim(),
    core_service: intake.what?.trim(),
    primary_problem: intake.problem?.trim(),
    customer_result: intake.result?.trim(),
    dream_outcome: intake.result?.trim(),
    current_revenue: asNumber(intake.current_revenue),
    desired_revenue: asNumber(intake.desired_revenue),
    business_stage: intake.business_stage || "idea",
    acquisition_method: intake.acquisition_method?.trim() || "Not specified",
    existing_recurring_revenue: asNumber(intake.existing_recurring_revenue),
    offer_tiers: intake.tiers || "all",
    deployment_platform: intake.platform || "gohighlevel",
    profile_version: 2,
    profile_source: "idea_intake",
    last_synced_at: new Date().toISOString(),
  };

  if (launchResult) {
    payload.launch_system_snapshot = {
      intake: { ...intake },
      result: launchResult,
    };
  }

  return payload;
}

export async function saveUnifiedBusinessProfile(intake, launchResult) {
  const payload = buildBusinessProfilePayload(intake, launchResult);

  if (intake.business_id) {
    const business = await requireOwnedBusiness(intake.business_id);
    return base44.entities.Business.update(business.id, payload);
  }

  return base44.entities.Business.create(payload);
}

export async function syncLaunchSystemSnapshot(launchSystem) {
  const businessId = launchSystem?.business_id || launchSystem?.intake?.business_id;
  if (!businessId || !launchSystem?.intake || !launchSystem?.result) return null;

  const business = await requireOwnedBusiness(businessId);
  return base44.entities.Business.update(business.id, {
    launch_system_snapshot: {
      intake: launchSystem.intake,
      result: launchSystem.result,
    },
    profile_version: 2,
    profile_source: "launch_system",
    last_synced_at: new Date().toISOString(),
  });
}

export function restoreLaunchSystemFromProfile(business) {
  const snapshot = business?.launch_system_snapshot;
  if (!snapshot?.intake || !snapshot?.result) return null;

  return {
    ...snapshot,
    business_id: business.id,
    profile_version: business.profile_version || 2,
    intake: {
      ...snapshot.intake,
      business_id: business.id,
    },
  };
}
