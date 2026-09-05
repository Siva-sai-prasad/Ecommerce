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

type Product = {
  id: number;
  name: string;
  price: number;
  tag: string;
  description: string;
  imageUrl: string;
};

const API_BASE_URL = 'http://localhost:8080/api';
const AUTH_BASE_URL = 'http://localhost:8080';
const AUTH_TOKEN_KEY = 'ecommerce.jwt';
const USER_NAME_KEY = 'ecommerce.userName';

const catalog: Product[] = [
  {
    id: 1,
    name: 'Laptop',
    price: 999.0,
    tag: 'Featured',
    description: 'Lightweight business laptop for daily productivity.',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    name: 'Headphones',
    price: 89.99,
    tag: 'Popular',
    description: 'Noise-cancelling headphones with a warm bass profile.',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    name: 'Phone',
    price: 599.0,
    tag: 'New',
    description: 'Premium smartphone with crisp camera performance.',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    name: 'Smart Watch',
    price: 179.0,
    tag: 'Trending',
    description: 'Fitness-focused smartwatch with health tracking.',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
  },
];

const cartItems: Array<{ id: number; name: string; price: number; quantity: number }> = [];

let currentPage = 0;
let pageSize = 5;
let sortField = 'createdAt';
let sortDirection = 'desc';
let currentView = 'products';
let authMode: 'login' | 'signup' = 'login';
let authMessage = '';

function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) ?? '';
}

function getStoredUserName() {
  return localStorage.getItem(USER_NAME_KEY) ?? 'Customer';
}

function saveUserSession(token: string, name: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_NAME_KEY, name);
}

function clearUserSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}

function isLoggedIn() {
  return Boolean(getStoredToken());
}

async function fetchOrders(page = currentPage, size = pageSize): Promise<OrdersPage> {
  const url = `${API_BASE_URL}/orders?page=${page}&size=${size}&sort=${sortField},${sortDirection}`;
  const token = getStoredToken();

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load orders: ${response.status}`);
  }

  return response.json();
}

async function fetchCurrentUser() {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Unable to load account');
  }

  return response.json();
}

async function handleAuthSubmit(event: SubmitEvent) {
  event.preventDefault();

  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();

  const endpoint = `${AUTH_BASE_URL}/auth/${authMode === 'signup' ? 'signup' : 'login'}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        authMode === 'signup'
          ? { name, email, password }
          : { email, password },
      ),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.message ?? 'Authentication failed');
    }

    if (authMode === 'signup') {
      authMode = 'login';
      authMessage = 'Account created successfully. Please sign in.';
      renderView();
      return;
    }

    const token = payload.token;
    if (!token) {
      throw new Error('No token returned from the server');
    }

    saveUserSession(token, email);
    const profile = await fetchCurrentUser();
    saveUserSession(token, profile.name ?? email);
    authMessage = '';
    currentView = 'products';
    renderView();
  } catch (error) {
    authMessage = error instanceof Error ? error.message : 'Authentication failed';
    renderView();
  }
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
          <a href="#" data-view="orders">Orders</a>
          <a href="#" data-view="cart">Cart <span id="cart-badge" class="cart-badge" hidden>0</span></a>
          <a href="#" data-view="login">${isLoggedIn() ? getStoredUserName() : 'Login'}</a>
          ${isLoggedIn() ? '<button class="nav-action" id="logout-btn" type="button">Logout</button>' : ''}
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
        if (target === 'login' && isLoggedIn()) {
          currentView = 'products';
        } else {
          currentView = target;
        }
        renderView();
      }
    });
  });

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', () => {
    clearUserSession();
    currentView = 'login';
    renderView();
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
        <button class="primary-btn" type="button">New arrival</button>
      </header>

      <div class="product-grid">
        ${catalog
          .map(
            (product) => `
              <div class="product-card">
                <span class="product-tag">${product.tag}</span>
                <img class="product-image" src="${product.imageUrl}" alt="${product.name}" />
                <h3>${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                  <span class="product-price">$${product.price.toFixed(2)}</span>
                  <button type="button" class="secondary-btn add-to-cart-btn" data-product-id="${product.id}">Add to cart</button>
                </div>
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
  const isLoginMode = authMode === 'login';

  return `
    <div class="page-container form-container">
      <div class="auth-card">
        <p class="auth-kicker">${isLoginMode ? 'Customer login' : 'Create account'}</p>
        <h1>${isLoginMode ? 'Welcome back' : 'Join our store'}</h1>

        ${authMessage ? `<p class="auth-message">${authMessage}</p>` : ''}

        <form class="auth-form" id="auth-form">
          ${!isLoginMode ? `
            <label>
              Full name
              <input name="name" type="text" placeholder="Your name" required />
            </label>
          ` : ''}

          <label>
            Email
            <input name="email" type="email" placeholder="name@example.com" required />
          </label>

          <label>
            Password
            <input name="password" type="password" placeholder="••••••••" required />
          </label>

          <div class="auth-helpers">
            <span class="text-link">Forgot password</span>
          </div>

          <div class="auth-actions">
            <button type="submit" class="primary-btn">${isLoginMode ? 'Sign in' : 'Sign up'}</button>
            <button type="button" class="secondary-btn light-btn" id="toggle-auth-mode">${isLoginMode ? 'Sign up' : 'Sign in'}</button>
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
    const form = document.getElementById('auth-form');
    form?.addEventListener('submit', handleAuthSubmit);

    const toggleButton = document.getElementById('toggle-auth-mode');
    toggleButton?.addEventListener('click', () => {
      authMode = authMode === 'login' ? 'signup' : 'login';
      authMessage = '';
      renderView();
    });
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
