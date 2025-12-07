// =========================================================
//  GROWTH — PRODUCTS PAGE (FINAL CLEAN VERSION)
// =========================================================

// ---------------------- CONFIG ---------------------------
const PRODUCTS_TABLE = "products";

const grid = document.getElementById("productsGrid");
const filterButtons = document.querySelectorAll(".filter-btn");
const paginationEl = document.getElementById("pagination");

const searchInput = document.getElementById("productSearch");
const suggestionsEl = document.getElementById("searchSuggestions");

let allProducts = [];
let activeFilter = "all";
let searchQuery = "";
let currentPage = 1;
const PAGE_SIZE = 30;


// ---------------------- HELPERS ---------------------------
function unitPrice(p) {
  return p.discountPrice && p.discountPrice < p.price
    ? p.discountPrice
    : p.price;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ---------------------- LOAD PRODUCTS ---------------------
async function loadProductsFromSupabase() {
  try {
    const { data, error } = await window.supabase
      .from(PRODUCTS_TABLE)
      .select("*");

    if (error) {
      console.error("Products load error:", error);
      return;
    }

    allProducts = (data || []).map(p => ({
      id: p.id,
      name: p.name || p.title || "",
      description: p.description || "",
      price: Number(p.price) || 0,
      discountPrice: p.discount_price ? Number(p.discount_price) : null,
      stock: Number(p.stock) || 0,
      category: p.category || "other",
      image: p.image_path || null,
      images: Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : p.image_path ? [p.image_path] : [],
    }));

    shuffle(allProducts);
    renderProducts();
  } catch (err) {
    console.error("Unexpected load error:", err);
  }
}


// ---------------------- FILTER / SEARCH --------------------
function getFilteredProducts() {
  let filtered = allProducts;

  if (activeFilter !== "all") {
    filtered = filtered.filter(p => p.category === activeFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
  }

  return filtered;
}


// ---------------------- PAGINATION -------------------------
function renderPagination(totalPages) {
  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  paginationEl.innerHTML = Array.from({ length: totalPages }, (_, i) => {
    const page = i + 1;
    return `<button class="page-btn ${page === currentPage ? "active" : ""}" data-page="${page}">${page}</button>`;
  }).join("");

  paginationEl.querySelectorAll(".page-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.page);
      renderProducts();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}


// ---------------------- RENDER PRODUCTS --------------------
function renderProducts() {
  if (!grid) return;

  const filtered = getFilteredProducts();

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state">No products found.</div>`;
    paginationEl.innerHTML = "";
    return;
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  grid.innerHTML = pageItems.map(p => {
    const out = p.stock <= 0;
    const low = p.stock > 0 && p.stock <= 3;

    let stockClass = "stock-pill";
    let stockText = "In stock";

    if (low) {
      stockClass += " low";
      stockText = `Low: ${p.stock}`;
    }
    if (out) {
      stockClass += " out";
      stockText = "Out of stock";
    }

    const hasDiscount = p.discountPrice && p.discountPrice < p.price;
    const priceHtml = hasDiscount
      ? `<span class="old-price">${p.price}$</span><span class="new-price">${p.discountPrice}$</span>`
      : `<span class="new-price">${p.price}$</span>`;

    const img = p.image || p.images?.[0] || "assets/img/sock1.jpg";

    return `
      <article class="product-card" data-product-id="${p.id}">
        <a href="product.html?id=${p.id}" class="product-link">
          <div class="product-image-wrap">
            <span class="${stockClass}">${stockText}</span>
            <img src="${img}" class="product-image" alt="${p.name}">
          </div>

          <div class="product-info">
            <h2 class="product-title">${p.name}</h2>
            <p class="price-line">${priceHtml}</p>
          </div>
        </a>

        <button class="card-add-btn" data-id="${p.id}" ${out ? "disabled" : ""}>+</button>
      </article>
    `;
  }).join("");

  renderPagination(totalPages);
}


// ---------------------- ADD TO CART ------------------------
function handleAddToCart(id) {
  const product = allProducts.find(p => p.id == id);
  if (!product) return;

  const cart = readCart();
  const existing = cart.find(item => item.id == id);

  const nextQty = existing ? existing.qty + 1 : 1;

  if (product.stock && nextQty > product.stock) {
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
      price,
      originalPrice: product.price,
      stock: product.stock,
      image: product.image || product.images?.[0] || "",
    });
  }

  writeCart(cart);
  updateCartCount();
  showToast("Added to cart.");
}

function setupGridClick() {
  grid.addEventListener("click", e => {
    const btn = e.target.closest(".card-add-btn");
    if (btn) handleAddToCart(btn.dataset.id);
  });
}


// ---------------------- FILTER BUTTONS ---------------------
function setupFilters() {
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
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


// ---------------------- SEARCH SUGGESTIONS -----------------
function renderSuggestions() {
  if (!searchInput) return;

  const q = searchQuery.trim().toLowerCase();
  if (!q) {
    suggestionsEl.style.display = "none";
    suggestionsEl.innerHTML = "";
    return;
  }

  const matches = allProducts
    .filter(p => p.name.toLowerCase().includes(q))
    .slice(0, 10);

  if (!matches.length) {
    suggestionsEl.style.display = "none";
    return;
  }

  suggestionsEl.innerHTML = matches.map(p => {
    const img = p.image || p.images?.[0];
    return `
      <div class="suggestion-item" data-id="${p.id}">
        <img src="${img}" class="suggestion-thumb">
        <span>${p.name}</span>
      </div>
    `;
  }).join("");

  suggestionsEl.style.display = "block";
}

function setupSearch() {
  if (!searchInput) return;

  searchInput.addEventListener("input", e => {
    searchQuery = e.target.value.trim();
    renderProducts();
    renderSuggestions();
  });

  suggestionsEl.addEventListener("click", e => {
    const item = e.target.closest(".suggestion-item");
    if (item) window.location.href = `product.html?id=${item.dataset.id}`;
  });
}


// ---------------------- INIT -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromSupabase();
  setupFilters();
  setupSearch();
  setupGridClick();
});
