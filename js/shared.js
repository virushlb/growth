const CART_KEY = "growth_cart";
const PRODUCTS_KEY = "growth_products";
const DELIVERY_FEE = 4;

function defaultProducts() {
  return [
    {
      id: "sock-cozy-1",
      name: "Cozy striped socks",
      price: 12,
      discountPrice: 9,
      category: "socks",
      image: "assets/img/sock1.jpg",
      images: ["assets/img/sock1.jpg", "assets/img/sock2.jpg"],
      stock: 8,
      description: "Soft cotton striped socks that keep your feet warm and cozy.",
      active: true
    },
    {
      id: "sock-plain-1",
      name: "Plain beige socks",
      price: 8,
      discountPrice: null,
      category: "socks",
      image: "assets/img/sock2.jpg",
      images: ["assets/img/sock2.jpg"],
      stock: 5,
      description: "Minimal beige socks that go with everything. Everyday comfort.",
      active: true
    },
    {
      id: "gift-mug-1",
      name: "Warm mug",
      price: 10,
      discountPrice: 8,
      category: "mugs",
      image: "assets/img/mug1.jpg",
      images: ["assets/img/mug1.jpg"],
      stock: 3,
      description: "Ceramic mug for coffee or tea with a soft cozy vibe.",
      active: true
    },
    {
      id: "gift-mini-1",
      name: "Mini gift box",
      price: 15,
      discountPrice: null,
      category: "gifts",
      image: "assets/img/gift1.jpg",
      images: ["assets/img/gift1.jpg"],
      stock: 4,
      description: "Small gift box with mixed little items, ready to offer.",
      active: true
    }
  ];
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
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("cart parse error", e);
    return [];
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}


function updateCartCount() {
  const cart = readCart();
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
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



document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();

  // Mark body as ready for fade-in
  document.body.classList.add("page-ready");

  // Scroll reveal
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("is-visible"));
  }

  // Theme toggle
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

