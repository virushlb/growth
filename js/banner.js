import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://ngtzknecstzlxcpeelth.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndHprbmVjc3R6bHhjcGVlbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTQ5NjksImV4cCI6MjA3ODE5MDk2OX0.IXvn2GvftKM96DObzCzA1Nvaye9dHri7t5SZfER0eDg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadBanner() {
  const { data, error } = await supabase
    .from("promo_settings")
    .select("*")
    .single();

  if (error) {
    console.log("promo error:", error);
    return;
  }

  if (!data.is_active) return; // banner OFF

  const banner = document.getElementById("promoBanner");

  // Use the correct column name: discount
  const code = data.code || "";
  const percent = data.discount || 0;

banner.innerHTML = `
  <span>Use</span>
  <strong>${code}</strong>
  <span>for</span>
  <strong>${percent}% off</strong>
  <span id="closeBanner">✕</span>
`;




  banner.style.display = "flex";

  document.getElementById("closeBanner").onclick = () => {
    banner.style.display = "none";
  };
}

loadBanner();
