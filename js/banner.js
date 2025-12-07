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

    // If inactive → hide
    if (!data.active) {
      banner.style.display = "none";
      return;
    }

    // Render banner
    banner.innerHTML = `
      Use <strong>${data.code}</strong> for <strong>${data.discount}% off</strong>
      
    `;

    banner.style.display = "flex";

    // Wait a tiny moment so DOM updates fully
    setTimeout(() => {
      const closeBtn = document.getElementById("closeBanner");
      if (closeBtn) {
        closeBtn.onclick = () => {
          banner.style.display = "none";
        };
      }
    }, 50);

  } catch (err) {
    console.error("Banner load error:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadPromoBanner);
