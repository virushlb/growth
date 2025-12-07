// ==========================
// GROWTH — PROMO BANNER
// ==========================

const supabaseClient = window.supabase; // already created in shared.js

async function loadPromoBanner() {
  try {
    const { data, error } = await supabaseClient
      .from("promo_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Promo fetch error:", error);
      return;
    }

    const banner = document.getElementById("promoBanner");
    if (!banner) return;

    // If inactive OR banner explicitly disabled → hide completely
    const isActive =
      data && typeof data.active === "boolean" ? data.active : !!data?.is_active;
    const bannerEnabled =
      data && typeof data.banner_enabled === "boolean"
        ? data.banner_enabled
        : true;

    if (!isActive || !bannerEnabled) {
      banner.innerHTML = "";
      banner.style.setProperty("display", "none", "important");
      return;
    }

    // Render banner (percent-only, black bar, site-wide)
    const code = (data.code || "").toUpperCase();
    const discount = data.discount ?? "";

    banner.innerHTML = `
      Use <strong>${code}</strong> for <strong>${discount}% off</strong>
    `;

    banner.style.setProperty("display", "flex", "important");
  } catch (err) {
    console.error("Banner load error:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadPromoBanner);
