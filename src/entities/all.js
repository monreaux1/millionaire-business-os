import { base44 } from "@/api/base44Client";

export const { Business, Strategy, MoneyModel, BrandProfile, AssetProject, FunnelProject, CommerceSettings, FunnelLead } = base44.entities;

// Base44 exposed the signed-in user as an entity.
export const User = {
  me: () => base44.auth.me(),
  updateMyUserData: (fields) => base44.auth.updateMe(fields),
};
