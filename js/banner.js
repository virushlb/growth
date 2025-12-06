// banner.js — uses global supabase, no imports

async function loadBanner() {
  const banner = document.getElementById("promoBanner");
  if (!banner) return;

  // Use global supabase (already created elsewhere)
  if (!window.supabase) {
    console.warn("Supabase client missing.");
    banner.style.display = "none";
    return;
  }

  const { data, error } = await window.supabase
    .from("promo_settings")
    .select("*")
    .single();

  if (error || !data) {
    banner.style.display = "none";
    return;
  }

  const isActive = !!data.is_active;
  const bannerEnabled =
    typeof data.banner_enabled === "boolean" ? data.banner_enabled : true;

  const code = (data.code || "").toUpperCase();
  const percent = data.discount ?? 0;

  if (!isActive || !bannerEnabled || !code || !percent) {
    banner.style.display = "none";
    return;
  }

  banner.innerHTML = `
    Use code <strong>${code}</strong> for <strong>${percent}% off</strong>
    <span id="closeBanner">✕</span>
  `;
  banner.style.display = "flex";

  const closeBtn = document.getElementById("closeBanner");
  if (closeBtn) closeBtn.onclick = () => banner.style.display = "none";
}

document.addEventListener("DOMContentLoaded", loadBanner);