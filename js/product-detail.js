const PRODUCTS_TABLE = "products";

const detailRoot = document.getElementById("productDetail");

function getQueryId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function pickRandomRelated(products, currentId, count = 3) {
  const others = products.filter(p => p.id !== currentId && p.active !== false);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  return others.slice(0, count);
}

async function renderProductDetail() {
  if (!detailRoot) return;
  const id = getQueryId();
  let products = [];
  let product = null;

try {
    const { data, error } = await window.supabase
      .from(PRODUCTS_TABLE)
      .select("*");

    if (error) {
      console.error("Failed to load product detail:", error);
    } else {
      products = (data || []).map(row => ({
        id: row.id,
        name: row.name || "",
        price: typeof row.price === "number" ? row.price : parseFloat(row.price || "0") || 0,
        discountPrice: row.discount_price != null
          ? (typeof row.discount_price === "number" ? row.discount_price : parseFloat(row.discount_price))
          : null,
        category: row.category || "other",
        description: row.description || "",
        stock: typeof row.stock === "number"
          ? row.stock
          : parseInt(row.stock || "0", 10) || 0,
        image: row.image_path || null,
        images: Array.isArray(row.images) && row.images.length
          ? row.images
          : (row.image_path ? [row.image_path] : []),
        active: true
      }));

      product = products.find(p => p.id == id);
    }
  } catch (err) {
    console.error("Error loading product detail from Supabase", err);
  }

  if (!product) {
    detailRoot.innerHTML = '<div class="empty-state">Product not found.</div>';
    return;
  }

  const hasDiscount = product.discountPrice != null && product.discountPrice < product.price;
  const priceHtml = hasDiscount
    ? `<span class="old-price">${product.price}$</span><span class="new-price">${product.discountPrice}$</span>`
    : `<span class="new-price">${product.price}$</span>`;

  const out = product.stock <= 0;
  const low = product.stock > 0 && product.stock <= 3;
  let stockLabel = "In stock";
  let stockClass = "stock-pill detail";
  if (low) {
    stockLabel = `Low: ${product.stock}`;
    stockClass += " low";
  }
  if (out) {
    stockLabel = "Out of stock";
    stockClass += " out";
  }

  const images = (product.images && product.images.length ? product.images : [product.image]).filter(Boolean);
  const mainImage = images[0] || "assets/img/sock1.jpg";

  const related = pickRandomRelated(products, product.id, 3);

  detailRoot.innerHTML = `
    <article class="product-detail-card">
      <nav class="breadcrumb">
        <a href="index.html">Home</a> › <a href="products.html">Products</a>
      </nav>
      <header class="product-detail-header">
        <div>
          <h1 class="product-detail-title">${product.name}</h1>
          <p class="price-line-detail">${priceHtml}</p>
        </div>
        <span class="${stockClass}">${stockLabel}</span>
      </header>

      <div class="product-detail-gallery">
        <div class="gallery-main">
          <img src="${mainImage}" alt="${product.name}" id="galleryMain">
        </div>

        ${images.length > 1 ? `
        <div class="gallery-thumbs">
          ${images
            .map(
              (src, idx) => `
            <button type="button" class="gallery-thumb ${idx === 0 ? "active" : ""}" data-src="${src}">
              <img src="${src}" alt="${product.name} thumbnail ${idx + 1}">
            </button>`
            )
            .join("")}
        </div>` : ""}
      </div>

      <p class="product-detail-description">
        ${product.description || "This product is part of the growth collection of socks & gifts."}
      </p>

      <div class="detail-actions">
        <div class="qty-pill">
          <button type="button" id="detailMinus">−</button>
          <span id="detailQty">1</span>
          <button type="button" id="detailPlus">+</button>
        </div>
        <button class="btn primary" id="detailAdd" ${out ? "disabled" : ""}>Add to cart</button>
      </div>

      <p class="checkout-helper" style="margin-top:10px;">
        You can always adjust quantities later in your cart.
      </p>

      ${
        related.length
          ? `<h2 class="related-heading">You might also like</h2>
             <div class="related-grid">
               ${related
                 .map(r => {
                   const cover = r.image || (r.images && r.images[0]) || "assets/img/sock1.jpg";
                   return `
                   <a href="product.html?id=${encodeURIComponent(r.id)}" class="related-card">
                     <img src="${cover}" alt="${r.name}">
                     <h3>${r.name}</h3>
                   </a>`;
                 })
                 .join("")}
             </div>`
          : ""
      }
    </article>
  `;

  let currentQty = 1;

  const minusBtn = document.getElementById("detailMinus");
  const plusBtn = document.getElementById("detailPlus");
  const qtySpan = document.getElementById("detailQty");
  const addBtn = document.getElementById("detailAdd");
  const mainImgEl = document.getElementById("galleryMain");

  function updateQty(newQty) {
    if (newQty < 1) newQty = 1;
    if (product.stock != null && newQty > product.stock) newQty = product.stock;
    currentQty = newQty;
    qtySpan.textContent = currentQty;
  }

  if (minusBtn && plusBtn && qtySpan) {
    minusBtn.addEventListener("click", () => updateQty(currentQty - 1));
    plusBtn.addEventListener("click", () => updateQty(currentQty + 1));
  }

  const thumbButtons = detailRoot.querySelectorAll(".gallery-thumb");
  if (thumbButtons && mainImgEl) {
    thumbButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const src = btn.getAttribute("data-src");
        mainImgEl.src = src;
        thumbButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  }

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const cart = readCart();
      const existing = cart.find(item => item.id === product.id);
      const price = product.discountPrice != null && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

      const current = existing ? existing.qty : 0;
      let desired = current + currentQty;
      if (product.stock != null && desired > product.stock) {
        desired = product.stock;
      }

      if (existing) {
        existing.qty = desired;
        existing.price = price;
        existing.originalPrice = product.price;
        existing.image = existing.image || product.image || (product.images && product.images[0]);
        existing.stock = product.stock;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price,
          originalPrice: product.price,
          image: product.image || (product.images && product.images[0]),
          qty: currentQty,
          stock: product.stock
        });
      }

      writeCart(cart);

      const toast = document.getElementById("toast");
      if (toast) {
        toast.textContent = "Added to cart ✔";
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 1800);
      }
    });
  }
}

renderProductDetail();