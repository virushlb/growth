import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ngtzknecstzlxcpeelth.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndHprbmVjc3R6bHhjcGVlbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTQ5NjksImV4cCI6MjA3ODE5MDk2OX0.IXvn2GvftKM96DObzCzA1Nvaye9dHri7t5SZfER0eDg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadProducts() {
  const container = document.getElementById("productsContainer");

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = "<p>Failed to load products 😢</p>";
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No products found yet.</p>";
    return;
  }

  
container.innerHTML = data.map(p => `
  <div class="product-card" data-category="${p.category}">
    <img src="${p.image}" class="product-img" alt="${p.name}">
    <div class="product-name">${p.name}</div>
    <div class="product-price">${p.price}$</div>
    <div class="product-buttons">
      <button class="btn add">Add to Cart</button>
      <button class="btn order">Order</button>
    </div>
  </div>
`).join("");
}

loadProducts();


document.addEventListener("click", (e)=>{
  if(e.target.classList.contains("product-img")){
    document.getElementById("modalImg").src = e.target.src;
    document.getElementById("imgModal").style.display = "flex";
  }
});
document.addEventListener("click", (e)=>{
  if(e.target.classList.contains("close")){
    document.getElementById("imgModal").style.display = "none";
  }
});


document.addEventListener("click", e => {
  if (e.target.classList.contains("order")) {
    const card = e.target.closest(".product-card");
    const product = {
      name: card.querySelector(".product-name").innerText,
      price: card.querySelector(".product-price").innerText.replace("$",""),
      image: card.querySelector(".product-img").src
    };
    localStorage.setItem("checkout_product", JSON.stringify(product));
    window.location.href = "checkout.html";
  }
});
