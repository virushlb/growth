const PRODUCTS_TABLE = "products";

const adminBody = document.getElementById("adminBody");
const addBtn = document.getElementById("addProduct");
const saveBtn = document.getElementById("saveProducts");
const resetBtn = document.getElementById("resetDemo");
const statusEl = document.getElementById("adminStatus");

let products = [];

async function loadAdminProducts() {
  try {
      headers: {
      }
    });
    if (!res.ok) {
      console.error("Failed to load products from Supabase", await res.text());
      products = [];
    } else {
      const data = await res.json();
      products = (data || []).map(row => ({
        id: row.id,
        name: row.name || "",
        price: typeof row.price === "number" ? row.price : parseFloat(row.price || "0") || 0,
        discountPrice: row.discount_price != null ? (typeof row.discount_price === "number" ? row.discount_price : parseFloat(row.discount_price)) : null,
        category: row.category || "",
        description: row.description || "",
        stock: typeof row.stock === "number" ? row.stock : parseInt(row.stock || "0", 10) || 0,
        image: row.image_path || null,
        images: row.image_path ? [row.image_path] : [],
        active: true
      }));
    }
  } catch (err) {
    console.error("Error loading products from Supabase", err);
    products = [];
  }
  renderAdminTable();
}

function renderAdminTable() {
  if (!adminBody) return;
  if (!products.length) {
    adminBody.innerHTML = '<tr><td colspan="9" style="padding:8px 6px;color:#666;">No products yet. Click "Add product".</td></tr>';
    return;
  }
  adminBody.innerHTML = products
    .map((p, idx) => {
      const imagesArr = Array.isArray(p.images) && p.images.length
        ? p.images
        : (p.image ? [p.image] : []);
      const imagesJson = JSON.stringify(imagesArr);
      const previews = imagesArr.length
        ? imagesArr.slice(0, 5).map((src, i) => `
            <button type="button" class="adm-image-chip" data-index="${i}">
              <img src="${src}" alt="image ${i + 1}">
              <span class="adm-image-remove">&times;</span>
            </button>
          `).join("")
        : '<span class="adm-image-empty">No images yet</span>';

      return `
        <tr data-index="${idx}">
          <td><input type="text" class="adm-name" value="${p.name || ""}"></td>
          <td>
            <select class="adm-category">
              <option value="socks" ${p.category === "socks" ? "selected" : ""}>socks</option>
              <option value="gifts" ${p.category === "gifts" ? "selected" : ""}>gifts</option>
              <option value="mugs" ${p.category === "mugs" ? "selected" : ""}>mugs</option>
              <option value="accessories" ${p.category === "accessories" ? "selected" : ""}>accessories</option>
            </select>
          </td>
          <td><input type="number" class="adm-price" value="${p.price ?? ""}" min="0" step="0.1"></td>
          <td><input type="number" class="adm-discount" value="${p.discountPrice ?? ""}" min="0" step="0.1"></td>
          <td><input type="number" class="adm-stock" value="${p.stock ?? ""}" min="0"></td>
          <td><textarea class="adm-description">${p.description || ""}</textarea></td>
          <td>
            <div class="adm-image-uploader">
              <div class="adm-image-previews">
                ${previews}
              </div>
              <button type="button" class="btn tiny ghost adm-image-add">+ Add image</button>
              <input type="file" class="adm-image-file" accept="image/*" multiple style="display:none;">
              <textarea class="adm-images" style="display:none;">${imagesJson}</textarea>
            </div>
          </td>
          <td style="text-align:center;">
            <input type="checkbox" class="adm-active" ${p.active === false ? "" : "checked"}>
          </td>
          <td style="text-align:center;">
            <button type="button" class="btn-link adm-remove" style="color:#b05c13;">x</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function collectFromTable() {
  const rows = adminBody.querySelectorAll("tr[data-index]");
  const next = [];
  rows.forEach(row => {
    const idx = parseInt(row.getAttribute("data-index"), 10);
    const base = products[idx] || {};
    const name = row.querySelector(".adm-name").value.trim();
    if (!name) return;
    const category = row.querySelector(".adm-category").value;
    const priceVal = parseFloat(row.querySelector(".adm-price").value);
    const discountValRaw = row.querySelector(".adm-discount").value;
    const discountVal = discountValRaw === "" ? null : parseFloat(discountValRaw);
    const stockValRaw = row.querySelector(".adm-stock").value;
    const stockVal = stockValRaw === "" ? null : parseInt(stockValRaw, 10);
    const description = row.querySelector(".adm-description").value.trim();
    const imagesField = row.querySelector(".adm-images");
    const active = row.querySelector(".adm-active").checked;

    let images = [];
    if (imagesField) {
      const raw = imagesField.value.trim();
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            images = parsed.filter(Boolean);
          }
        } catch (err) {
          images = raw.split(",").map(s => s.trim()).filter(Boolean);
        }
      }
    }
    const image = images.length ? images[0] : (base.image || "");

    next.push({
      id: base.id || ("prod-" + Date.now() + "-" + Math.random().toString(16).slice(2)),
      name,
      category,
      price: isNaN(priceVal) ? 0 : priceVal,
      discountPrice: discountVal,
      stock: stockVal,
      description,
      images,
      image,
      active
    });
  });
  products = next;
}


function getRowImages(row) {
  const field = row.querySelector(".adm-images");
  if (!field) return [];
  const raw = field.value.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (err) {
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }
}

function setRowImages(row, images) {
  const max = 5;
  const list = images.slice(0, max);
  const field = row.querySelector(".adm-images");
  if (field) {
    field.value = JSON.stringify(list);
  }
  const previewWrap = row.querySelector(".adm-image-previews");
  if (previewWrap) {
    if (!list.length) {
      previewWrap.innerHTML = '<span class="adm-image-empty">No images yet</span>';
    } else {
      previewWrap.innerHTML = list
        .map((src, idx) => `
          <button type="button" class="adm-image-chip" data-index="${idx}">
            <img src="${src}" alt="image ${idx + 1}">
            <span class="adm-image-remove">&times;</span>
          </button>
        `)
        .join("");
    }
  }
}


if (adminBody) {

  adminBody.addEventListener("change", (e) => {
    const fileInput = e.target.closest(".adm-image-file");
    if (!fileInput) return;
    const row = fileInput.closest("tr[data-index]");
    if (!row) return;

    let images = getRowImages(row);
    const max = 5;
    const remaining = max - images.length;
    const files = Array.from(fileInput.files || []);
    if (!remaining || !files.length) {
      fileInput.value = "";
      return;
    }
    const toUse = files.slice(0, remaining);
    let pending = toUse.length;

    toUse.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        images.push(ev.target.result);
        pending -= 1;
        if (pending === 0) {
          setRowImages(row, images);
          fileInput.value = "";
        }
      };
      reader.readAsDataURL(file);
    });
  });

  renderAdminTable();

  adminBody.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".adm-remove");
    if (removeBtn) {
      const row = removeBtn.closest("tr[data-index]");
      const idx = parseInt(row.getAttribute("data-index"), 10);
      products.splice(idx, 1);
      renderAdminTable();
      return;
    }

    const addImgBtn = e.target.closest(".adm-image-add");
    if (addImgBtn) {
      const row = addImgBtn.closest("tr[data-index]");
      if (!row) return;
      const existing = getRowImages(row);
      if (existing.length >= 5) {
        alert("You can upload up to 5 images.");
        return;
      }
      const fileInput = row.querySelector(".adm-image-file");
      if (fileInput) {
        fileInput.click();
      }
      return;
    }

    const removeChipBtn = e.target.closest(".adm-image-remove");
    if (removeChipBtn) {
      const row = removeChipBtn.closest("tr[data-index]");
      const chip = removeChipBtn.closest(".adm-image-chip");
      if (!row || !chip) return;
      const idx = parseInt(chip.dataset.index, 10);
      let images = getRowImages(row);
      if (!isNaN(idx)) {
        images.splice(idx, 1);
        setRowImages(row, images);
      }
      return;
    }
  });

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      products.push({
        id: "prod-" + Date.now(),
        name: "New product",
        category: "socks",
        price: 0,
        discountPrice: null,
        stock: 0,
        description: "",
        images: [],
        image: "",
        active: true
      });
      renderAdminTable();
    });
  }

  if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    collectFromTable();
    try {
      // map products to DB rows
      const rows = products.map(p => ({
        id: p.id || `p-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: p.name,
        price: p.price ?? 0,
        discount_price: p.discountPrice != null ? p.discountPrice : null,
        category: p.category || "",
        description: p.description || "",
        image_path: (p.images && p.images[0]) || p.image || null,
        stock: p.stock ?? 0
      }));

      // delete all existing products
        method: "DELETE",
        headers: {
        }
      });

      // insert new set
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(rows)
      });

      if (!res.ok) {
        console.error("Failed to save products to Supabase", await res.text());
        if (statusEl) statusEl.textContent = "Error saving products to Supabase.";
      } else {
        const saved = await res.json();
        // update local ids from Supabase response
        products = saved.map(row => ({
          id: row.id,
          name: row.name || "",
          price: typeof row.price === "number" ? row.price : parseFloat(row.price || "0") || 0,
          discountPrice: row.discount_price != null ? (typeof row.discount_price === "number" ? row.discount_price : parseFloat(row.discount_price)) : null,
          category: row.category || "",
          description: row.description || "",
          stock: typeof row.stock === "number" ? row.stock : parseInt(row.stock || "0", 10) || 0,
          image: row.image_path || null,
          images: row.image_path ? [row.image_path] : [],
          active: true
        }));
        renderAdminTable();
        if (statusEl) statusEl.textContent = "Saved to Supabase. Refresh products page to see changes.";
      }
    } catch (err) {
      console.error("Unexpected error saving products", err);
      if (statusEl) statusEl.textContent = "Unexpected error saving products.";
    }
  });
}


  if (resetBtn) {
  resetBtn.addEventListener("click", async () => {
    products = defaultProducts();
    try {
      const rows = products.map(p => ({
        id: p.id || `p-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: p.name,
        price: p.price ?? 0,
        discount_price: p.discountPrice != null ? p.discountPrice : null,
        category: p.category || "",
        description: p.description || "",
        image_path: (p.images && p.images[0]) || p.image || null,
        stock: p.stock ?? 0
      }));
        method: "DELETE",
        headers: {
        }
      });
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(rows)
      });
      renderAdminTable();
      if (statusEl) statusEl.textContent = "Demo data restored to Supabase.";
    } catch (err) {
      console.error("Error resetting demo data", err);
      if (statusEl) statusEl.textContent = "Error restoring demo data.";
    }
  });
}

}


// === Promo admin ===
const promoCodeField = document.getElementById("promoAdminCode");
const promoDiscField = document.getElementById("promoAdminDiscount");
const promoSaveBtn = document.getElementById("promoAdminSave");
const promoMsg = document.getElementById("promoAdminMsg");

// Load existing
if (promoCodeField && promoDiscField) {
  promoCodeField.value = localStorage.getItem("growth_promo_code") || "";
  promoDiscField.value = localStorage.getItem("growth_promo_discount") || "";
}

if (promoSaveBtn) {
  promoSaveBtn.addEventListener("click", () => {
    const code = promoCodeField.value.trim().toUpperCase();
    const disc = promoDiscField.value.trim();

    if (!code || !disc) {
      promoMsg.textContent = "Promo removed.";
      localStorage.removeItem("growth_promo_code");
      localStorage.removeItem("growth_promo_discount");
      return;
    }

    localStorage.setItem("growth_promo_code", code);
    localStorage.setItem("growth_promo_discount", disc);
    promoMsg.textContent = "Promo saved!";
  });
}


document.addEventListener("DOMContentLoaded", () => {
  loadAdminProducts();
});