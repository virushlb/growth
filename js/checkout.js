let appliedPromo = null;

function decreaseLocalStock(cart) {
  try {
    const products = readProducts();
    let changed = false;
    cart.forEach(item => {
      const p = products.find(prod => prod.id === item.id);
      if (p && typeof p.stock === "number") {
        p.stock = Math.max(0, p.stock - item.qty);
        changed = true;
      }
    });
    if (changed) {
      writeProducts(products);
    }
  } catch (e) {
    console.error("Local stock update error:", e);
  }
}


// =============================
// SUPABASE CONFIG
// =============================
const SUPABASE_ORDERS_TABLE = "orders";

// =============================
// DECREASE STOCK IN SUPABASE
// =============================
async function decreaseStock(cart) {
  for (const item of cart) {
    try {
      if (!window.SUPABASE_URL || !window.SUPABASE_KEY) continue;
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/products?id=eq.${item.id}` ,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({ stock: item.stock - item.qty })
        }
      );

      if (!res.ok) {
        console.error("Failed to update stock:", await res.text());
      }
    } catch (e) {
      console.error("Stock update error:", e);
    }
  }
}

// =============================
// LOAD PROMO FROM ADMIN
// =============================
const promoConfig = (() => {
  const code = (localStorage.getItem("growth_promo_code")||"").trim().toUpperCase();
  const disc = parseFloat(localStorage.getItem("growth_promo_discount")||"0");
  if (!code || !disc) return null;
  return {code, rate: disc/100};
})();

// =============================
const checkoutSummaryEl = document.getElementById("checkoutSummary");
const checkoutForm = document.getElementById("checkoutForm");
const SHOP_WHATSAPP = "96171209028";

// =============================
// SAVE ORDER TO SUPABASE
// =============================
async function saveOrderToSupabase(order) {
  try {
    if (!window.SUPABASE_URL || !window.SUPABASE_KEY) return;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=representation"
      },
      body: JSON.stringify(order)
    });

    if (!res.ok) {
      console.error("Supabase insert failed:", await res.text());
    }
  } catch (err) {
    console.error("Supabase insert error:", err);
  }
}

// =============================
// COMPUTE TOTALS
// =============================
function computeTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = appliedPromo && promoConfig ? subtotal * promoConfig.rate : 0;
  const final = subtotal - discount + DELIVERY_FEE;
  return { subtotal, discount, total: final };
}

// =============================
// RENDER CHECKOUT SUMMARY
// =============================
function renderCheckoutSummary() {
  if (!checkoutSummaryEl) return;
  const cart = readCart();

  if (!cart.length) {
    checkoutSummaryEl.innerHTML = '<div class="empty-state">Your cart is empty.</div>';
    return;
  }

  const { subtotal, discount, total } = computeTotals(cart);
  const itemsHtml = cart.map(item => {
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;
    const priceInfo = hasDiscount
      ? `${item.price}$ (was ${item.originalPrice}$)`
      : `${item.price}$`;
    return `<li>${item.qty} × ${item.name} — ${priceInfo} each</li>`;
  }).join("");

  checkoutSummaryEl.innerHTML = `
    <h2>Order details</h2>
    <ul>${itemsHtml}</ul>
    <div class="summary-row"><span>Items</span><span>${subtotal.toFixed(1)}$</span></div>
    <div class="summary-row"><span>Delivery</span><span>${DELIVERY_FEE.toFixed(1)}$</span></div>
    <div class="summary-row total"><span>Total</span><span>${total.toFixed(1)}$</span></div>
  `;
}

if (checkoutSummaryEl) renderCheckoutSummary();

// =============================
// CHECKOUT SUBMIT
// =============================
if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(checkoutForm);
    const name = (data.get("name") || "").trim();
    const phone = (data.get("phone") || "").trim();
    const address = (data.get("address") || "").trim();
    const note = (data.get("note") || "").trim();
    const cart = readCart();

    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    if (!name || !phone || !address) {
      alert("Please fill your name, phone, and address.");
      return;
    }

    const { subtotal, discount, total } = computeTotals(cart);

    // FULL ORDER OBJECT
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
      status: "pending"
    };

    // SAVE ORDER IN SUPABASE
    await saveOrderToSupabase(orderPayload);

    // DECREASE STOCK (Supabase + local snapshot)
    await decreaseStock(cart);
    decreaseLocalStock(cart);

    // CLEAR CART LOCALLY
    localStorage.removeItem(CART_KEY);
    localStorage.removeItem("cart");
    writeCart([]);
    updateCartCount();

// BUILD CLEAN WHATSAPP MESSAGE (NO ITEMS FOR CUSTOMER)
const message = 
`🛍️ New Growth Order

👤 Name: ${name}
📞 Phone: ${phone}
📍 Address: ${address}
📝 Note: ${note || "—"}

Subtotal: ${subtotal.toFixed(1)}$
Delivery: ${DELIVERY_FEE.toFixed(1)}$
Total: ${total.toFixed(1)}$
`;

// SEND TO WHATSAPP
const waUrl = `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(message)}`;
window.location.href = waUrl;
  });
}
// =============================
// PROMO CODE
// =============================
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