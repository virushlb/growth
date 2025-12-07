// =============================
// SUPABASE GLOBAL CLIENT
// =============================

// pull constructor from UMD bundle
const { createClient } = supabase;

window.SUPABASE_URL = "https://ngtzknecstzlxcpeelth.supabase.co";
window.SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndHprbmVjc3R6bHhjcGVlbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTQ5NjksImV4cCI6MjA3ODE5MDk2OX0.IXvn2GvftKM96DObzCzA1Nvaye9dHri7t5SZfER0eDg";

window.supabase = createClient(window.SUPABASE_URL, window.SUPABASE_KEY);

// =============================
// CART SYSTEM (GLOBAL)
// =============================
const CART_KEY = "growth_cart";
const DELIVERY_FEE = 4.0; // or whatever price you want


// ---- Read Cart ----
function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

// ---- Write Cart ----
function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ---- Update Cart Icon Count ----
function updateCartCount() {
  const cart = readCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  const badge1 = document.getElementById("cartCount");
  const badge2 = document.getElementById("cartCountFloating");

  if (badge1) badge1.textContent = count;
  if (badge2) badge2.textContent = count;
}

// Automatically update cart count on every page load
document.addEventListener("DOMContentLoaded", updateCartCount);

// =============================
// TOAST SYSTEM (GLOBAL)
// =============================
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}
