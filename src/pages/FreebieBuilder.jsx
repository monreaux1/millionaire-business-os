import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { accountStorage } from "@/lib/account-storage";

// FreebieBuilder is now powered by ClientMagnetBuilder.
// We pre-populate accountStorage so the form is ready, then redirect.
export default function FreebieBuilder() {
  const navigate = useNavigate();

  useEffect(() => {
    const stored = accountStorage.getItem("launchSystem");
    if (stored) {
      try {
        const data = JSON.parse(stored).result;
        const business = data?.business_profile || {};
        // Pre-fill ClientMagnetBuilder form via accountStorage bridge
        accountStorage.setItem("clientMagnetPrefill", JSON.stringify({
          offer: business.core_service || data?.offer_stack?.core_offer?.name || "",
          audience: business.target_avatar || "",
          result: business.dream_outcome || business.desired_outcome || "",
        }));
      } catch (_) {}
    }
    navigate("/ClientMagnetBuilder", { replace: true });
  }, [navigate]);

  return null;
}