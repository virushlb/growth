const SUPABASE_URL = "https://ngtzknecstzlxcpeelth.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndHprbmVjc3R6bHhjcGVlbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTQ5NjksImV4cCI6MjA3ODE5MDk2OX0.IXvn2GvftKM96DObzCzA1Nvaye9dHri7t5SZfER0eDg";
const PRODUCTS_TABLE = "products";

const grid = document.getElementById("productsGrid");
const filterButtons = document.querySelectorAll(".filter-btn");
const toastEl = document.getElementById("toast");

let allProducts = [];
let activeFilter = "all";

function unitPrice(p) {
  return p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price;
}


async function loadProductsFromSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${PRODUCTS_TABLE}?select=*`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) {
      console.error("Failed to load products from Supabase", await res.text());
      allProducts = [];
    } else {
      const data = await res.json();
      allProducts = (data || []).map(row => ({
        id: row.id,
        name: row.name || "",
        price: typeof row.price === "number" ? row.price : parseFloat(row.price || "0") || 0,
        discountPrice: row.discount_price != null ? (typeof row.discount_price === "number" ? row.discount_price : parseFloat(row.discount_price)) : null,
        category: row.category || "other",
        description: row.description || "",
        stock: typeof row.stock === "number" ? row.stock : parseInt(row.stock || "0", 10) || 0,
        image: row.image_path || null,
        images: row.image_path ? [row.image_path] : [],
        active: true
      }));
    }
  } catch (err) {
    console.error("Error loading products from Supabase", err);
    allProducts = [];
  }
  renderProducts();
}

function renderProducts() {
  if (!grid) return;
  const filtered = allProducts.filter(p =>
    activeFilter === "all" ? true : p.category === activeFilter
  );

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state">No products in this category yet.</div>';
    return;
  }

  grid.innerHTML = filtered
    .map(p => {
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

      const hasDiscount = p.discountPrice != null && p.discountPrice < p.price;
      const priceHtml = hasDiscount
        ? `<span class="old-price">${p.price}$</span><span class="new-price">${p.discountPrice}$</span>`
        : `<span class="new-price">${p.price}$</span>`;

      const cover = p.image || (p.images && p.images[0]) || "assets/img/sock1.jpg";

      return `
      <article class="product-card" data-product-id="${p.id}">
        <a href="product.html?id=${encodeURIComponent(p.id)}" class="product-link">
          <div class="product-image-wrap">
            <span class="${stockClass}">${stockLabel}</span>
            <img src="${cover}" alt="${p.name}" class="product-image">
          </div>
          <div class="product-info">
            <h2 class="product-title">${p.name}</h2>
            <p class="price-line">${priceHtml}</p>
          </div>
        </a>
        <button class="card-add-btn" data-id="${p.id}" ${out ? "disabled" : ""}>+</button>
      </article>
      `;
    })
    .join("");
}

function showToast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function handleAddToCart(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  const cart = readCart();
  const existing = cart.find(item => item.id === id);
  const currentQty = existing ? existing.qty : 0;
  const nextQty = currentQty + 1;

  if (product.stock != null && nextQty > product.stock) {
    showToast("Not enough stock for this item.");
    return;
  }

  const price = unitPrice(product);

  if (existing) {
    existing.qty = nextQty;
    existing.price = price;
    existing.originalPrice = product.price;
    existing.image = existing.image || product.image || (product.images && product.images[0]);
    existing.stock = product.stock;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      qty: 1,
      price,
      originalPrice: product.price,
      image: product.image || (product.images && product.images[0]),
      stock: product.stock
    });
  }

  writeCart(cart);
  updateCartCount();
  showToast("Added to cart.");

  const card = document.querySelector(`.product-card[data-product-id="${id}"]`);
  if (card) {
    card.classList.add("wiggle");
    setTimeout(() => card.classList.remove("wiggle"), 300);
  }
}

if (grid) {
  renderProducts();

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".card-add-btn");
    if (!btn) return;
    e.preventDefault();
    const id = btn.getAttribute("data-id");
    handleAddToCart(id);
  });
}

if (filterButtons.length) {
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter || "all";
      renderProducts();
      const anchorId = btn.id;
      if (anchorId) {
        history.replaceState(null, "", "#" + anchorId);
      }
    });
  });
}
document.addEventListener("DOMContentLoaded", () => {
  loadProductsFromSupabase();
});
