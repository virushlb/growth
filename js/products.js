
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET = "product-images";
let ALL = [];

function imageURL(path){ return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}` }

async function loadProducts(){
  const grid = document.getElementById("productGrid");
  const loading = document.getElementById("loading");
  loading.style.display = "block";
  const { data, error } = await supabase.from("products")
    .select("id, name, price, category, description, image_path, stock")
    .order("created_at", { ascending: false });
  loading.style.display = "none";
  if(error){ console.error(error); grid.innerHTML="<p>Failed to load products.</p>"; return; }
  ALL = (data||[]).map(p => ({ ...p, category:(p.category||'').toLowerCase() }));
  render(ALL);
}

function render(list){
  const grid = document.getElementById("productGrid");
  grid.innerHTML = list.map(p => `
    <article class="card" data-id="${p.id}" data-category="${p.category}">
      <div class="img-wrap">
        <img src="${imageURL(p.image_path)}" alt="${p.name}" class="card-img"/>
      </div>
      <div class="card-info">
        <h4 class="card-title">${p.name}</h4>
        <p class="card-price">$${p.price}</p>
        <div class="card-actions">
          <button class="btn add" data-name="${p.name}" data-price="${p.price}">Add to cart</button>
        </div>
      </div>
      ${Number(p.stock)<=0 ? '<div class="oos">Out of stock</div>' : ''}
    </article>
  `).join("");

  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains('add')) return;
      const id = card.dataset.id;
      const prod = ALL.find(x => x.id === id);
      localStorage.setItem("view_product", JSON.stringify(prod));
      window.location.href = "product.html";
    });
  });

  setupCartButtons();
}

function setupCartButtons(){
  function load(){ try{return JSON.parse(localStorage.getItem("growth_cart")||"[]")}catch(e){return []} }
  function save(arr){ localStorage.setItem("growth_cart", JSON.stringify(arr)); const el=document.getElementById("cartCount"); if(el) el.textContent=arr.length; }

  document.querySelectorAll(".btn.add").forEach(btn=>{
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      const cart = load();
      cart.push({name:this.dataset.name, price:+this.dataset.price, qty:1});
      save(cart);
      this.textContent="Added ✓";
      setTimeout(()=>{ this.textContent="Add to cart"; }, 1000);
    });
  });

  save(load());
}

document.addEventListener("click", (e)=>{
  if(e.target.classList.contains("cat-btn")){
    const f = e.target.dataset.filter.toLowerCase();
    const list = f === "all" ? ALL : ALL.filter(p => p.category === f);
    render(list);
  }
});

loadProducts();
