const cartItemsEl = document.getElementById("cartItems");
const cartSummaryEl = document.getElementById("cartSummary");

function renderCart() {
  const cart = readCart();

  if (!cartItemsEl || !cartSummaryEl) return;

  if (!cart.length) {
    cartItemsEl.innerHTML = '<div class="empty-state">Your cart is empty. Add something from the products page.</div>';
    cartSummaryEl.innerHTML = "";
    return;
  }

  cartItemsEl.innerHTML = cart
    .map(item => {
      const lineTotal = item.price * item.qty;
      const hasDiscount = item.originalPrice && item.originalPrice > item.price;
      const priceText = hasDiscount
        ? `<span class="old-price">${item.originalPrice}$</span><span class="new-price">${item.price}$</span>`
        : `<span class="new-price">${item.price}$</span>`;

      const cover = item.image || "assets/img/sock1.jpg";

      return `
      <article class="cart-item">
        <div>
          <img src="${cover}" alt="${item.name}">
        </div>
        <div>
          <h2 class="cart-item-title">${item.name}</h2>
          <p class="cart-item-meta">${priceText} each</p>
          <div class="cart-item-actions">
            <div>
              <label style="font-size:0.75rem;">Qty</label>
              <input type="number" min="1" max="${item.stock ?? ""}" value="${item.qty}" data-id="${item.id}" class="qty-input">
            </div>
            <div style="text-align:right;">
              <div class="price">${lineTotal.toFixed(1)}$</div>
              <button class="btn-link" data-remove="${item.id}">Remove</button>
            </div>
          </div>
        </div>
      </article>
      `;
    })
    .join("");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal + DELIVERY_FEE;

  cartSummaryEl.innerHTML = `
    <h2>Order summary</h2>
    <div class="summary-row">
      <span>Items</span>
      <span>${subtotal.toFixed(1)}$</span>
    </div>
    <div class="summary-row">
      <span>Delivery</span>
      <span>${DELIVERY_FEE.toFixed(1)}$</span>
    </div>
    <div class="summary-row total">
      <span>Total</span>
      <span>${total.toFixed(1)}$</span>
    </div>
    <button class="btn primary full" id="goCheckout">Continue to checkout</button>
    <p style="font-size:0.8rem;color:var(--sub);margin-top:6px;">
      Payment on delivery. You can still adjust details on WhatsApp.
    </p>
  `;
}

if (cartItemsEl && cartSummaryEl) {
  renderCart();

  cartItemsEl.addEventListener("change", (e) => {
    const input = e.target.closest(".qty-input");
    if (!input) return;
    const id = input.getAttribute("data-id");
    let value = parseInt(input.value, 10);
    if (isNaN(value) || value < 1) value = 1;
    const cart = readCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;

    if (item.stock != null && value > item.stock) {
      value = item.stock;
      input.value = value;
    }

    item.qty = value;
    writeCart(cart);
    renderCart();
  });

  cartItemsEl.addEventListener("click", (e) => {
    const removeBtn = e.target.closest("button[data-remove]");
    if (!removeBtn) return;
    const id = removeBtn.getAttribute("data-remove");
    let cart = readCart().filter(i => i.id !== id);
    writeCart(cart);
    renderCart();
  });

  cartSummaryEl.addEventListener("click", (e) => {
    const btn = e.target.closest("#goCheckout");
    if (!btn) return;
    window.location.href = "checkout.html";
  });
}
