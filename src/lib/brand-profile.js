import { base44 } from "@/api/base44Client";

export const EMPTY_BRAND_PROFILE = {
  business_id: "", brand_name: "", logo_url: "", secondary_logo_url: "", favicon_url: "",
  primary_color: "#FF6A3D", secondary_color: "#0D0D0D", accent_color: "#F4F4F4",
  background_color: "#FFFFFF", text_color: "#0D0D0D", heading_font: "", body_font: "",
  brand_voice: "", tone: "", phrases_to_use: "", phrases_to_avoid: "", visual_style: "",
  media_urls: [], proof_assets: "", website: "", email: "", phone: "", social_links: "",
  booking_link: "", privacy_url: "", terms_url: "", copyright_text: "",
  completion_status: "draft", completion_score: 0, profile_version: 1,
};

const coreFields = ["brand_name", "logo_url", "primary_color", "secondary_color", "heading_font", "body_font", "brand_voice", "visual_style"];

export function getBrandCompletion(profile) {
  const completed = coreFields.filter((field) => String(profile?.[field] || "").trim()).length;
  return Math.round((completed / coreFields.length) * 100);
}

async function getCurrentOwnerEmail() {
  const user = await base44.auth.me();
  if (!user?.email) throw new Error("An authenticated account is required.");
  return user.email;
}

export async function getBrandProfileForBusiness(businessId) {
  if (!businessId) return null;
  const ownerEmail = await getCurrentOwnerEmail();
  const profiles = await base44.entities.BrandProfile.filter(
    { business_id: businessId, created_by: ownerEmail },
    "-updated_date",
    1
  );
  return profiles?.[0] || null;
}

export async function saveBrandProfile(profile) {
  const completion_score = getBrandCompletion(profile);
  const payload = { ...profile, completion_score, completion_status: completion_score >= 75 ? "ready" : "draft", profile_version: 1 };
  delete payload.id;
  delete payload.created_date;
  delete payload.updated_date;
  delete payload.created_by;
  if (profile.id) {
    const ownerEmail = await getCurrentOwnerEmail();
    const ownedProfiles = await base44.entities.BrandProfile.filter(
      { id: profile.id, created_by: ownerEmail },
      "-updated_date",
      1
    );
    if (!ownedProfiles?.[0]) throw new Error("This brand profile does not belong to the current account.");
    return base44.entities.BrandProfile.update(profile.id, payload);
  }
  return base44.entities.BrandProfile.create(payload);
}
