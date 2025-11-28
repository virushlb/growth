// Orders admin dashboard powered by Supabase
let lastOrderCount = null;

const ORDERS_TABLE = "orders";
const SUPABASE_URL = "https://ngtzknecstzlxcpeelth.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndHprbmVjc3R6bHhjcGVlbHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTQ5NjksImV4cCI6MjA3ODE5MDk2OX0.IXvn2GvftKM96DObzCzA1Nvaye9dHri7t5SZfER0eDg";
const SHOP_WHATSAPP = "96171209028";

const ordersBody = document.getElementById("ordersBody");
const ordersStatus = document.getElementById("ordersStatus");
const refreshBtn = document.getElementById("refreshOrders");

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function summarizeItems(items) {
  if (!Array.isArray(items) || !items.length) return "—";
  return items.map(item => {
    const qty = item.qty ?? 1;
    const name = item.name ?? "Item";
    const price = item.price ?? 0;
    return `${qty}× ${name} (${price}$)`;
  }).join(", ");
}

function formatTotals(order) {
  const subtotal = order.subtotal ?? 0;
  const delivery = order.delivery ?? 0;
  const discount = order.discount ?? 0;
  const total = order.total ?? (subtotal - discount + delivery);
  return [
    `Items: ${subtotal.toFixed(1)}$`,
    `Deliv: ${delivery.toFixed(1)}$`,
    discount ? `Disc: -${discount.toFixed(1)}$` : null,
    `Total: ${total.toFixed(1)}$`
  ].filter(Boolean).join("\n");
}

function buildWhatsAppText(order) {
  const lines = [];
  lines.push("*New growth order*");
  lines.push("");
  lines.push(`Name: ${order.name || ""}`);
  lines.push(`Phone: ${order.phone || ""}`);
  lines.push(`Address: ${order.address || ""}`);
  if (order.note) {
    lines.push(`Note: ${order.note}`);
  }
  lines.push("");
  lines.push("Items:");
  const items = Array.isArray(order.items) ? order.items : [];
  items.forEach(item => {
    const qty = item.qty ?? 1;
    const name = item.name ?? "Item";
    const price = item.price ?? 0;
    const original = item.originalPrice && item.originalPrice > price
      ? ` (was ${item.originalPrice}$)`
      : "";
    lines.push(`- ${qty} × ${name} — ${price}$${original}`);
  });
  lines.push("");
  const subtotal = order.subtotal ?? 0;
  const delivery = order.delivery ?? 0;
  const discount = order.discount ?? 0;
  const total = order.total ?? (subtotal - discount + delivery);
  lines.push(`Items total: ${subtotal.toFixed(1)}$`);
  lines.push(`Delivery: ${delivery.toFixed(1)}$`);
  if (discount) {
    lines.push(`Discount: -${discount.toFixed(1)}$`);
  }
  lines.push(`Total: ${total.toFixed(1)}$`);
  return lines.join("\n");
}

async function fetchOrders() {
  if (!ordersBody) return;
  ordersBody.innerHTML = "<tr><td colspan=\"7\">Loading orders…</td></tr>";
  if (ordersStatus) ordersStatus.textContent = "";

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${ORDERS_TABLE}?select=*&order=created_at.desc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Failed to fetch orders:", txt);
      ordersBody.innerHTML = "<tr><td colspan=\"7\">Error loading orders.</td></tr>";
      if (ordersStatus) ordersStatus.textContent = "Error loading orders from Supabase.";
      return;
    }

    const data = await res.json();
    if (!data.length) {
      ordersBody.innerHTML = "<tr><td colspan=\"7\">No orders yet.</td></tr>";
      if (ordersStatus) ordersStatus.textContent = "No orders found.";
      return;
    }

    ordersBody.innerHTML = "";
    // simple notification when new orders arrive
    if (Array.isArray(data)) {
      if (lastOrderCount !== null && data.length > lastOrderCount) {
        if (ordersStatus) ordersStatus.textContent = "New orders received.";
      } else if (ordersStatus) {
        ordersStatus.textContent = "Orders updated.";
      }
      lastOrderCount = data.length;
    }

    data.forEach(order => {
      const tr = document.createElement("tr");

      const createdTd = document.createElement("td");
      createdTd.textContent = formatDateTime(order.created_at);
      tr.appendChild(createdTd);

      const customerTd = document.createElement("td");
      customerTd.innerHTML = `<strong>${order.name || ""}</strong><br><span class="subtle">${order.address || ""}</span>`;
      tr.appendChild(customerTd);

      const contactTd = document.createElement("td");
      contactTd.innerHTML = `${order.phone || ""}${order.note ? `<br><span class="subtle">Note: ${order.note}</span>` : ""}`;
      tr.appendChild(contactTd);

      const itemsTd = document.createElement("td");
      itemsTd.textContent = summarizeItems(order.items);
      tr.appendChild(itemsTd);

      const totalsTd = document.createElement("td");
      totalsTd.innerHTML = formatTotals(order).replace(/\n/g, "<br>");
      tr.appendChild(totalsTd);

      const statusTd = document.createElement("td");
      const status = order.status || "pending";
      statusTd.textContent = status;
      statusTd.className = status === "confirmed" ? "status-pill status-ok" : "status-pill status-pending";
      tr.appendChild(statusTd);

      const actionsTd = document.createElement("td");
      actionsTd.className = "admin-actions-cell";

      const waBtn = document.createElement("button");
      waBtn.type = "button";
      waBtn.className = "btn small ghost";
      waBtn.textContent = "WhatsApp";
      waBtn.addEventListener("click", () => {
        const text = encodeURIComponent(buildWhatsAppText(order));
        const url = `https://wa.me/${SHOP_WHATSAPP}?text=${text}`;
        window.open(url, "_blank");
      });
      actionsTd.appendChild(waBtn);

      const confirmBtn = document.createElement("button");
      confirmBtn.type = "button";
      confirmBtn.className = "btn small";
      confirmBtn.textContent = "Mark confirmed";
      confirmBtn.addEventListener("click", async () => {
        try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/${ORDERS_TABLE}?id=eq.${order.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ status: "confirmed" }),
          });
          if (!res.ok) {
            console.error("Failed to update order status:", await res.text());
            if (ordersStatus) ordersStatus.textContent = "Failed to update order status.";
          } else {
            if (ordersStatus) ordersStatus.textContent = "Order marked as confirmed.";
            fetchOrders();
          }
        } catch (err) {
          console.error("Error updating order status:", err);
          if (ordersStatus) ordersStatus.textContent = "Error updating order status.";
        }
      });
      actionsTd.appendChild(confirmBtn);


      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn small danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Delete this order?")) return;
        try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/${ORDERS_TABLE}?id=eq.${order.id}`, {
            method: "DELETE",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              Prefer: "return-minimal",
            },
          });
          if (!res.ok) {
            console.error("Failed to delete order:", await res.text());
            if (ordersStatus) ordersStatus.textContent = "Failed to delete order.";
          } else {
            if (ordersStatus) ordersStatus.textContent = "Order deleted.";
            fetchOrders();
          }
        } catch (err) {
          console.error("Error deleting order:", err);
          if (ordersStatus) ordersStatus.textContent = "Error deleting order.";
        }
      });
      actionsTd.appendChild(deleteBtn);

      tr.appendChild(actionsTd);
      ordersBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Unexpected error fetching orders:", err);
    ordersBody.innerHTML = "<tr><td colspan=\"7\">Error loading orders.</td></tr>";
    if (ordersStatus) ordersStatus.textContent = "Error loading orders from Supabase.";
  }
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    fetchOrders();
  });
}

// Auto-load on page open
if (ordersBody) {
  fetchOrders();
}

// Auto-refresh every 20 seconds
setInterval(() => {
  if (ordersBody) {
    fetchOrders();
  }
}, 20000);
