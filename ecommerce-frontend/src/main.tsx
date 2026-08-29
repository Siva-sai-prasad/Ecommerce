import './index.css';

const app = document.getElementById('app');

type OrderItem = {
  id?: number | null;
  productId?: number | null;
  productName?: string | null;
  quantity: number;
  price: number;
};

type Order = {
  id: number;
  userEmail: string;
  status: string;
  total: number;
  items: OrderItem[];
};

type OrdersPage = {
  content: Order[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

const API_BASE_URL = 'http://localhost:8080/api';
const catalog = [
  { id: 1, name: 'Laptop', price: 999.0, tag: 'Featured' },
  { id: 2, name: 'Headphones', price: 89.99, tag: 'Popular' },
  { id: 3, name: 'Phone', price: 599.0, tag: 'New' },
  { id: 4, name: 'Smart Watch', price: 179.0, tag: 'Trending' },
];

const cartItems: Array<{ id: number; name: string; price: number; quantity: number }> = [];

let currentPage = 0;
let pageSize = 5;
let sortField = 'createdAt';
let sortDirection = 'desc';
let currentView = 'orders';

async function fetchOrders(page = currentPage, size = pageSize): Promise<OrdersPage> {
  const url = `${API_BASE_URL}/orders?page=${page}&size=${size}&sort=${sortField},${sortDirection}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load orders: ${response.status}`);
  }

  return response.json();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (badge) {
    badge.textContent = String(total);
    badge.hidden = total === 0;
  }
}

function renderShell() {
  if (!app) return;

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand-wrap">
          <div class="brand-logo">S</div>
          <div class="brand-copy">
            <span class="brand-name">ShopFlow</span>
            <small>Commerce</small>
          </div>
        </div>
        <nav class="nav">
          <a href="#" data-view="dashboard">Dashboard</a>
          <a href="#" data-view="products">Products</a>
          <a href="#" data-view="orders" class="active">Orders</a>
          <a href="#" data-view="cart">Cart <span id="cart-badge" class="cart-badge" hidden>0</span></a>
          <a href="#" data-view="login">Login</a>
        </nav>
      </aside>

      <main class="main-panel">
        <div id="page-root"></div>
      </main>
    </div>
  `;

  updateCartBadge();

  document.querySelectorAll('[data-view]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const target = (event.currentTarget as HTMLElement).dataset.view;
      if (target) {
        currentView = target;
        renderView();
      }
    });
  });
}

function addToCart(productId: number) {
  const product = catalog.find((item) => item.id === productId);
  if (!product) return;

  const existing = cartItems.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
  }

  updateCartBadge();
}

function renderDashboard() {
  return `
    <div class="page-container">
      <header class="topbar">
        <h1>Dashboard</h1>
        <button class="primary-btn" type="button">Overview</button>
      </header>

      <section class="feature-banner">
        <div>
          <span class="chip">Live overview</span>
          <h2>Skyline commerce is growing fast.</h2>
          <p>Track performance, customer orders, and sales across your storefront.</p>
        </div>
        <button class="primary-btn" type="button">View report</button>
      </section>

      <section class="summary-grid">
        <div class="summary-card accent-card">
          <span>Revenue</span>
          <strong>$12,480</strong>
          <small>+18.2% this month</small>
        </div>
        <div class="summary-card">
          <span>Orders</span>
          <strong>128</strong>
          <small>24 waiting for shipment</small>
        </div>
        <div class="summary-card">
          <span>Customers</span>
          <strong>94</strong>
          <small>12 new this week</small>
        </div>
      </section>
    </div>
  `;
}

function renderProducts() {
  return `
    <div class="page-container">
      <header class="topbar">
        <h1>Products</h1>
        <button class="primary-btn" type="button">Add Product</button>
      </header>

      <div class="product-grid">
        ${catalog
          .map(
            (product) => `
              <div class="product-card">
                <span class="product-tag">${product.tag}</span>
                <div class="product-icon">▣</div>
                <h3>${product.name}</h3>
                <p>$${product.price.toFixed(2)}</p>
                <button type="button" class="secondary-btn add-to-cart-btn" data-product-id="${product.id}">Add to cart</button>
              </div>
            `,
          )
          .join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.add-to-cart-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = Number((button as HTMLElement).dataset.productId);
      addToCart(productId);
    });
  });
}

function renderCartPage() {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return `
    <div class="page-container">
      <header class="topbar">
        <h1>Cart</h1>
        <button class="primary-btn" type="button">Checkout</button>
      </header>

      ${cartItems.length === 0
        ? '<div class="empty-cart">Your cart is empty. Add products to continue.</div>'
        : `
          <div class="cart-list">
            ${cartItems
              .map(
                (item) => `
                  <div class="cart-item">
                    <div>
                      <strong>${item.name}</strong>
                      <span>Qty ${item.quantity}</span>
                    </div>
                    <div class="cart-price">$${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                `,
              )
              .join('')}
          </div>
          <div class="cart-summary">
            <span>Total</span>
            <strong>$${total.toFixed(2)}</strong>
          </div>
        `}
    </div>
  `;
}

function renderLogin() {
  return `
    <div class="page-container form-container">
      <div class="auth-card">
        <p class="auth-kicker">Customer login</p>
        <h1>Welcome back</h1>
        <form class="auth-form">
          <label>
            Email
            <input type="email" placeholder="name@example.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="••••••••" />
          </label>

          <div class="auth-helpers">
            <span class="text-link">Forgot password</span>
          </div>

          <div class="auth-actions">
            <button type="submit" class="primary-btn">Sign in</button>
            <button type="button" class="secondary-btn light-btn">Sign up</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderOrdersPage() {
  return `
    <div class="page-container">
      <header class="topbar">
        <h1>Orders</h1>
        <button class="primary-btn" type="button">New Order</button>
      </header>

      <section class="summary-grid">
        <div class="summary-card">
          <span>Total Orders</span>
          <strong id="total-orders">0</strong>
        </div>
        <div class="summary-card">
          <span>Pages</span>
          <strong id="total-pages">0</strong>
        </div>
        <div class="summary-card">
          <span>Current Page</span>
          <strong id="current-page">1</strong>
        </div>
      </section>

      <section class="orders-panel">
        <div class="panel-header">
          <h2>Recent Orders</h2>
          <div class="toolbar">
            <label>
              Sort by
              <select id="sort-select">
                <option value="createdAt,desc">Newest</option>
                <option value="createdAt,asc">Oldest</option>
                <option value="total,desc">Highest total</option>
                <option value="total,asc">Lowest total</option>
              </select>
            </label>
            <label>
              Page size
              <select id="page-size-select">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </label>
          </div>
        </div>

        <div id="orders-container" class="orders-table">
          <div class="table-head table-row">
            <span>Order ID</span>
            <span>Status</span>
            <span>Total</span>
            <span>Items</span>
          </div>
        </div>

        <div class="pagination-row">
          <button id="prev-btn" class="page-btn" type="button">Previous</button>
          <span id="page-indicator">Page 1</span>
          <button id="next-btn" class="page-btn" type="button">Next</button>
        </div>
      </section>
    </div>
  `;
}

function renderView() {
  const pageRoot = document.getElementById('page-root');
  if (!pageRoot) return;

  document.querySelectorAll('[data-view]').forEach((link) => {
    const current = link as HTMLElement;
    current.classList.toggle('active', current.dataset.view === currentView);
  });

  if (currentView === 'dashboard') {
    pageRoot.innerHTML = renderDashboard();
    return;
  }

  if (currentView === 'products') {
    pageRoot.innerHTML = renderProducts();
    const addBtns = document.querySelectorAll('.add-to-cart-btn');
    addBtns.forEach((button) => {
      button.addEventListener('click', () => {
        const productId = Number((button as HTMLElement).dataset.productId);
        addToCart(productId);
      });
    });
    return;
  }

  if (currentView === 'cart') {
    pageRoot.innerHTML = renderCartPage();
    return;
  }

  if (currentView === 'login') {
    pageRoot.innerHTML = renderLogin();
    return;
  }

  pageRoot.innerHTML = renderOrdersPage();
  bindOrderControls();
  void loadOrders();
}

function bindOrderControls() {
  const sortSelect = document.getElementById('sort-select');
  const pageSizeSelect = document.getElementById('page-size-select');
  const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('next-btn') as HTMLButtonElement | null;

  sortSelect?.addEventListener('change', async (event) => {
    const [field, direction] = (event.target as HTMLSelectElement).value.split(',');
    sortField = field;
    sortDirection = direction;
    currentPage = 0;
    await loadOrders();
  });

  pageSizeSelect?.addEventListener('change', async (event) => {
    pageSize = Number((event.target as HTMLSelectElement).value);
    currentPage = 0;
    await loadOrders();
  });

  prevBtn?.addEventListener('click', async () => {
    if (currentPage > 0) {
      currentPage -= 1;
      await loadOrders();
    }
  });

  nextBtn?.addEventListener('click', async () => {
    currentPage += 1;
    await loadOrders();
  });
}

function renderOrders(pageData: OrdersPage | null) {
  const container = document.getElementById('orders-container');
  if (!container) return;

  const orders = pageData?.content ?? [];

  const rows = orders
    .map(
      (order: Order) => `
        <div class="table-row">
          <span>#${order.id}</span>
          <span class="status-pill">${order.status}</span>
          <span>$${Number(order.total || 0).toFixed(2)}</span>
          <span>${order.items?.length ?? 0}</span>
        </div>
      `,
    )
    .join('');

  container.innerHTML = `
    <div class="table-head table-row">
      <span>Order ID</span>
      <span>Status</span>
      <span>Total</span>
      <span>Items</span>
    </div>
    ${rows || '<div class="empty-state">No orders found.</div>'}
  `;

  const totalOrdersEl = document.getElementById('total-orders');
  const totalPagesEl = document.getElementById('total-pages');
  const currentPageEl = document.getElementById('current-page');
  const pageIndicatorEl = document.getElementById('page-indicator');
  const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('next-btn') as HTMLButtonElement | null;

  if (totalOrdersEl) totalOrdersEl.textContent = String(pageData?.totalElements ?? 0);
  if (totalPagesEl) totalPagesEl.textContent = String(pageData?.totalPages ?? 0);
  if (currentPageEl) currentPageEl.textContent = String((pageData?.number ?? 0) + 1);
  if (pageIndicatorEl) pageIndicatorEl.textContent = `Page ${(pageData?.number ?? 0) + 1}`;

  if (prevBtn) prevBtn.disabled = (pageData?.number ?? 0) === 0;
  if (nextBtn) nextBtn.disabled = (pageData?.number ?? 0) >= (pageData?.totalPages ?? 1) - 1;
}

async function loadOrders() {
  try {
    const data = await fetchOrders();
    renderOrders(data);
  } catch (error: unknown) {
    const container = document.getElementById('orders-container');
    if (container) {
      container.innerHTML = `
        <div class="table-head table-row">
          <span>Order ID</span>
          <span>Status</span>
          <span>Total</span>
          <span>Items</span>
        </div>
        <div class="error-state">${error instanceof Error ? error.message : 'Failed to load orders.'}</div>
      `;
    }
  }
}

renderShell();
renderView();
