// Shared utilities and Supabase client for Growth

// =============================
// SUPABASE GLOBAL CLIENT
// =============================

// Your Supabase project URL + anon key
const SUPABASE_URL = "https://ngtzknecstzlxcpeelth.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndHprbmVjc3R6bHhjcGVlbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTQ5NjksImV4cCI6MjA3ODE5MDk2OX0.IXvn2GvftKM96DObzCzA1Nvaye9dHri7t5SZfER0eDg";

// Expose for other scripts that still use fetch(...)
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;

// Create a single shared Supabase client if the library is present
if (typeof supabase !== "undefined" && !window.supabaseClient) {
  window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  // Backwards‑compat alias used in banner.js & products.js
  window.supabase = window.supabaseClient;
}

// =============================
// CART + PRODUCTS CONSTANTS
// =============================
const CART_KEY = "growth_cart";
const PRODUCTS_KEY = "growth_products";
const DELIVERY_FEE = 4;

// =============================
// CART HELPERS
// =============================
function readCart() {
  try {
    const raw =
      localStorage.getItem(CART_KEY) ??
      localStorage.getItem("cart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("cart parse error", e);
    return [];
  }
}

function writeCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart || []));
  } catch (e) {
    console.warn("Failed to write cart to localStorage", e);
  }
}

function updateCartCount() {
  const cart = readCart();
  const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);

  const badge = document.getElementById("cartCount");
  const floating = document.getElementById("cartCountFloating");

  if (badge) {
    badge.textContent = count;
    badge.classList.add("bump");
    setTimeout(() => badge.classList.remove("bump"), 300);
  }
  if (floating) {
    floating.textContent = count;
    floating.classList.add("bump");
    setTimeout(() => floating.classList.remove("bump"), 300);
  }
}

// =============================
// PRODUCTS CACHE (optional)
// =============================
function defaultProducts() {
  return [];
}

function readProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("products parse error", e);
  }
  return defaultProducts();
}

function writeProducts(products) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products || []));
  } catch (e) {
    console.error("writeProducts error", e);
  }
}

// =============================
// TOAST
// =============================
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// =============================
// SHARED INIT
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // Always sync cart count on page load
  updateCartCount();

  // Theme toggle (optional)
  const root = document.body;
  const toggle = document.getElementById("themeToggle");
  const storedTheme = localStorage.getItem("growth_theme");
  if (storedTheme === "dark") {
    root.classList.add("dark-theme");
  }
  if (toggle) {
    toggle.addEventListener("click", () => {
      const isDark = root.classList.toggle("dark-theme");
      localStorage.setItem("growth_theme", isDark ? "dark" : "light");
    });
  }
});
