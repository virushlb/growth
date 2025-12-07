// =========================================================
// GROWTH — CHECKOUT PAGE (FINAL VERSION)
// =========================================================

// -------------------- GLOBAL VARIABLES --------------------
let appliedPromo = null;
let promoConfig = null;

const SUPABASE_ORDERS_TABLE = "orders";
const SHOP_WHATSAPP = "96171209028";

const checkoutSummaryEl = document.getElementById("checkoutSummary");
const checkoutForm = document.getElementById("checkoutForm");


// -------------------- LOAD PROMO FROM SUPABASE --------------------
async function loadPromoFromSupabase() {
  try {
    const { data, error } = await window.supabase
      .from("promo_settings")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Promo fetch error:", error);
      return;
    }

    if (data && data.length && data[0].is_active) {
      promoConfig = {
        code: (data[0].code || "").toUpperCase(),
        rate: Number(data[0].discount) / 100,
      };
    } else {
      promoConfig = null;
    }
  } catch (err) {
    console.error("Promo load exception:", err);
  }
}


// -------------------- SAVE ORDER IN SUPABASE --------------------
async function saveOrderToSupabase(order) {
  try {
    const { error } = await window.supabase
      .from(SUPABASE_ORDERS_TABLE)
      .insert([order]);

    if (error) {
      console.error("Supabase insert failed:", error);
    }
  } catch (err) {
    console.error("Supabase insert error:", err);
  }
}


// -------------------- STOCK HANDLING --------------------
async function decreaseStock(cart) {
  for (const item of cart) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ stock: item.stock - item.qty }),
      });
    } catch (err) {
      console.error("Stock update error:", err);
    }
  }
}

function decreaseLocalStock(cart) {
  try {
    const products = readProducts();
    cart.forEach(item => {
      const p = products.find(prod => prod.id === item.id);
      if (p) p.stock = Math.max(0, p.stock - item.qty);
    });
    writeProducts(products);
  } catch (err) {
    console.error("Local stock update error:", err);
  }
}


// -------------------- TOTALS --------------------
function computeTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = appliedPromo && promoConfig ? subtotal * promoConfig.rate : 0;
  const total = subtotal - discount + DELIVERY_FEE;
  return { subtotal, discount, total };
}


// -------------------- RENDER SUMMARY --------------------
function renderCheckoutSummary() {
  if (!checkoutSummaryEl) return;

  const cart = readCart();
  if (!cart.length) {
    checkoutSummaryEl.innerHTML = `<div class="empty-state">Your cart is empty.</div>`;
    return;
  }

  const { subtotal, discount, total } = computeTotals(cart);

  const itemsHtml = cart
    .map(item => {
      const oldPrice = item.originalPrice > item.price ? ` (was ${item.originalPrice}$)` : "";
      return `<li>${item.qty} × ${item.name} — ${item.price}$${oldPrice}</li>`;
    })
    .join("");

  checkoutSummaryEl.innerHTML = `
    <h2>Order details</h2>
    <ul>${itemsHtml}</ul>
    <div class="summary-row"><span>Items</span><span>${subtotal.toFixed(1)}$</span></div>
    <div class="summary-row"><span>Delivery</span><span>${DELIVERY_FEE.toFixed(1)}$</span></div>
    <div class="summary-row total"><span>Total</span><span>${total.toFixed(1)}$</span></div>
  `;
}


// -------------------- PROMO BUTTON --------------------
const promoBtn = document.getElementById("applyPromo");
const promoInput = document.getElementById("promoInput");
const promoMsg = document.getElementById("promoMsg");

if (promoBtn) {
  promoBtn.addEventListener("click", () => {
    const entered = promoInput.value.trim().toUpperCase();

    if (!promoConfig) {
      appliedPromo = null;
      promoMsg.textContent = "No promo active.";
      promoMsg.className = "promo-message err";
    } else if (entered === promoConfig.code) {
      appliedPromo = entered;
      promoMsg.textContent = "Promo applied!";
      promoMsg.className = "promo-message ok";
    } else {
      appliedPromo = null;
      promoMsg.textContent = "Invalid promo.";
      promoMsg.className = "promo-message err";
    }

    renderCheckoutSummary();
  });
}


// -------------------- CHECKOUT SUBMIT --------------------
if (checkoutForm) {
  checkoutForm.addEventListener("submit", async e => {
    e.preventDefault();

    const data = new FormData(checkoutForm);
    const name = data.get("name").trim();
    const phone = data.get("phone").trim();
    const address = data.get("address").trim();
    const note = data.get("note").trim();
    const cart = readCart();

    if (!cart.length) return alert("Your cart is empty.");
    if (!name || !phone || !address) return alert("Please fill all required fields.");

    const { subtotal, discount, total } = computeTotals(cart);

    const orderPayload = {
      name,
      phone,
      address,
      note,
      items: cart,
      subtotal,
      delivery: DELIVERY_FEE,
      discount,
      total,
      created_at: new Date().toISOString(),
      status: "pending",
    };

    await saveOrderToSupabase(orderPayload);
    await decreaseStock(cart);
    decreaseLocalStock(cart);

    writeCart([]);
    updateCartCount();

    const message = `
🛍️ New Growth Order

👤 Name: ${name}
📞 Phone: ${phone}
📍 Address: ${address}
📝 Note: ${note || "—"}

Subtotal: ${subtotal.toFixed(1)}$
Delivery: ${DELIVERY_FEE.toFixed(1)}$
Total: ${total.toFixed(1)}$
`;

    window.location.href =
      `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(message)}`;
  });
}


// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", async () => {
  await loadPromoFromSupabase();
  renderCheckoutSummary();
});
