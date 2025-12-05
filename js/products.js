// =========================================================
//  GROWTH — PRODUCTS PAGE JAVASCRIPT (FINAL STABLE VERSION)
// =========================================================

// -------------------- CONFIG --------------------
const SUPABASE_URL = "https://ngtzknecstzlxcpeelth.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndHprbmVjc3R6bHhjcGVlbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTQ5NjksImV4cCI6MjA3ODE5MDk2OX0.IXvn2GvftKM96DObzCzA1Nvaye9dHri7t5SZfER0eDg";

const PRODUCTS_TABLE = "products";

const grid = document.getElementById("productsGrid");
const filterButtons = document.querySelectorAll(".filter-btn");
const toastEl = document.getElementById("toast");

const searchInput = document.getElementById("productSearch");
const suggestionsEl = document.getElementById("searchSuggestions");
const paginationEl = document.getElementById("pagination");

let allProducts = [];
let activeFilter = "all";
let searchQuery = "";
let currentPage = 1;
const PAGE_SIZE = 30;

// -------------------- HELPERS --------------------
function unitPrice(p) {
  return p.discountPrice != null && p.discountPrice < p.price
    ? p.discountPrice
    : p.price;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// -------------------- LOAD PRODUCTS --------------------
async function loadProductsFromSupabase() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${PRODUCTS_TABLE}?select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!res.ok) {
      console.error("Failed to load products:", await res.text());
      allProducts = [];
    } else {
      const data = await res.json();
      allProducts = (data || []).map((row) => ({
        id: row.id,
        name: row.name || row.title || "",
        price:
          typeof row.price === "number"
            ? row.price
            : parseFloat(row.price || "0") || 0,
        discountPrice:
          row.discount_price != null
            ? parseFloat(row.discount_price)
            : null,
        category: row.category || "other",
        description: row.description || "",
        stock:
          typeof row.stock === "number"
            ? row.stock
            : parseInt(row.stock || "0", 10) || 0,
        image: row.image_path || null,
        images:
          Array.isArray(row.images) && row.images.length
            ? row.images
            : row.image_path
            ? [row.image_path]
            : [],
        active: true,
      }));

      shuffleInPlace(allProducts);
    }
  } catch (err) {
    console.error("Error loading products:", err);
    allProducts = [];
  }

  renderProducts();
}

// -------------------- FILTER + SEARCH + PAGINATION --------------------
function getFilteredProducts() {
  let filtered = allProducts.filter((p) =>
    activeFilter === "all" ? true : p.category === activeFilter
  );

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }

  return filtered;
}

function renderPagination(totalPages) {
  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn${
      i === currentPage ? " active" : ""
    }" data-page="${i}">${i}</button>`;
  }

  paginationEl.innerHTML = html;

  paginationEl.querySelectorAll(".page-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.page);
      renderProducts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function renderProducts() {
  if (!grid) return;

  const filtered = getFilteredProducts();

  if (!filtered.length) {
    grid.innerHTML =
      '<div class="empty-state">No products found. Try another search.</div>';
    paginationEl.innerHTML = "";
    return;
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = filtered.slice(start, end);

  grid.innerHTML = pageItems
    .map((p) => {
      const out = p.stock <= 0;
      const low = p.stock > 0 && p.stock <= 3;

      let stockLabel = "In stock";
      let stockClass = "stock-pill";
      if (low) {
        stockLabel = `Low: ${p.stock}`;
        stockClass += " low";
      }
      if (out) {
        stockLabel = "Out of stock";
        stockClass += " out";
      }

      const hasDiscount =
        p.discountPrice != null && p.discountPrice < p.price;
      const priceHtml = hasDiscount
        ? `<span class="old-price">${p.price}$</span><span class="new-price">${p.discountPrice}$</span>`
        : `<span class="new-price">${p.price}$</span>`;

      const cover =
        p.image || (p.images && p.images[0]) || "assets/img/sock1.jpg";

      return `
      <article class="product-card" data-product-id="${p.id}">
        <a href="product.html?id=${encodeURIComponent(
          p.id
        )}" class="product-link">
          <div class="product-image-wrap">
            <span class="${stockClass}">${stockLabel}</span>
            <img src="${cover}" alt="${p.name}" class="product-image">
          </div>
          <div class="product-info">
            <h2 class="product-title">${p.name}</h2>
            <p class="price-line">${priceHtml}</p>
          </div>
        </a>
        <button class="card-add-btn" data-id="${p.id}" ${
        out ? "disabled" : ""
      }>+</button>
      </article>
      `;
    })
    .join("");

  renderPagination(totalPages);
}
// -------------------- CART STORAGE --------------------
function readCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function writeCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const cart = readCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);

  const badge1 = document.getElementById("cartCount");
  const badge2 = document.getElementById("cartCountFloating");

  if (badge1) badge1.textContent = total;
  if (badge2) badge2.textContent = total;
}

// -------------------- CART ADD LOGIC --------------------
function handleAddToCart(id) {
  const product = allProducts.find((p) => p.id == id);
  if (!product) return;

  const cart = readCart();
  const existing = cart.find((item) => item.id == id);
  const nextQty = existing ? existing.qty + 1 : 1;

  if (product.stock != null && nextQty > product.stock) {
    showToast("Not enough stock.");
    return;
  }

  const price = unitPrice(product);

  if (existing) {
    existing.qty = nextQty;
    existing.price = price;
    existing.originalPrice = product.price;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      qty: 1,
      price: price,
      originalPrice: product.price,
      image:
        product.image || (product.images && product.images[0]) || "",
      stock: product.stock,
    });
  }

  writeCart(cart);
  updateCartCount();
  showToast("Added to cart.");
}

// -------------------- CART HANDLER FOR PRODUCT GRID --------------------
function setupGridClick() {
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".card-add-btn");
    if (!btn) return;

    const id = btn.dataset.id;
    handleAddToCart(id);
  });
}

// -------------------- FILTER BUTTONS --------------------
function setupFilters() {
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      activeFilter = btn.dataset.filter || "all";
      currentPage = 1;

      renderProducts();
      renderSuggestions();

      if (btn.id) {
        history.replaceState(null, "", "#" + btn.id);
      }
    });
  });
}

// -------------------- SEARCH SUGGESTIONS --------------------
function renderSuggestions() {
  if (!suggestionsEl || !searchInput) return;

  const q = searchQuery.trim().toLowerCase();

  if (!q) {
    suggestionsEl.style.display = "none";
    suggestionsEl.innerHTML = "";
    return;
  }

  const matches = allProducts
    .filter(p => (p.name || "").toLowerCase().includes(q))
    .slice(0, 10);

  if (!matches.length) {
    suggestionsEl.style.display = "none";
    suggestionsEl.innerHTML = "";
    return;
  }

  suggestionsEl.innerHTML = `
    <div class="suggestions-header" style="display:flex;justify-content:space-between;align-items:center;">
      <span>Results</span>
      <button id="closeSuggestions"
        style="
          background:none;
          border:none;
          font-size:20px;
          cursor:pointer;
          padding:5px;
          pointer-events:auto;
          z-index:9999;
        "
      >✕</button>
    </div>

    ${matches.map(p => {
      const cover = p.image || (p.images?.[0]) || "assets/img/sock1.jpg";
      return `
        <div class="suggestion-item" data-id="${p.id}"
          style="display:flex;align-items:center;gap:10px;padding:10px;">
          <img src="${cover}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">
          <span>${p.name}</span>
        </div>`;
    }).join("")}
  `;

  suggestionsEl.style.display = "block";
  suggestionsEl.style.pointerEvents = "auto";
  suggestionsEl.style.zIndex = "999999";

  // FORCE click listener to attach after HTML is created
  const closeBtn = document.getElementById("closeSuggestions");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      suggestionsEl.innerHTML = "";
      suggestionsEl.style.display = "none";
      searchInput.blur();
    });
  }
}



// -------------------- setup search listeners --------------------
function setupSearch() {
  if (!searchInput || !suggestionsEl) return;

  searchInput.addEventListener("input", e => {
    searchQuery = e.target.value.trim();
    renderProducts();
    renderSuggestions();
  });

  suggestionsEl.addEventListener("click", e => {
    // If user clicked X, ignore suggestion-item logic
    if (e.target.id === "closeSuggestions") return;

    const item = e.target.closest(".suggestion-item");
    if (item) {
      window.location.href = `product.html?id=${item.dataset.id}`;
    }
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim() !== "") {
      renderSuggestions();
    }
  });
}

// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromSupabase();
  setupGridClick();
  setupFilters();
  setupSearch();
});
