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
  orderId: number;
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

type CreateOrderRequest = {
  productId: number;
  quantity: number;
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
const USER_ROLE_KEY = 'ecommerce.userRole';

let catalog: Product[] = [
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

function getStoredUserRole() {
  return localStorage.getItem(USER_ROLE_KEY) ?? 'USER';
}

function saveUserSession(token: string, name: string, role = 'USER') {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_NAME_KEY, name);
  localStorage.setItem(USER_ROLE_KEY, role);
}

function clearUserSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
}

function isLoggedIn() {
  return Boolean(getStoredToken());
}

function isAdmin() {
  return getStoredUserRole() === 'ADMIN';
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

async function fetchAdminOrders(): Promise<OrdersPage> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/admin/orders?page=0&size=50&sort=createdAt,desc`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to load admin orders: ${response.status}`);
  }

  return response.json();
}

async function updateOrderStatus(orderId: number, status: string) {
  const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getStoredToken()}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? `Status update failed: ${response.status}`);
  }
}

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/products`);
  if (!response.ok) {
    throw new Error(`Failed to load products: ${response.status}`);
  }

  const products = await response.json();
  return products.map((product: Omit<Product, 'tag'>, index: number) => ({
    ...product,
    tag: ['Featured', 'Popular', 'New', 'Trending'][index % 4],
  }));
}

async function createProduct(form: HTMLFormElement) {
  const formData = new FormData(form);
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: String(formData.get('name') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      imageUrl: String(formData.get('imageUrl') ?? '').trim(),
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? `Product creation failed: ${response.status}`);
  }

  return response.json() as Promise<Product>;
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

async function submitOrder(request: CreateOrderRequest) {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? `Checkout failed: ${response.status}`);
  }

  return response.json() as Promise<Order>;
}

async function handleCheckout() {
  if (!isLoggedIn()) {
    authMode = 'login';
    authMessage = 'Please sign in before checkout.';
    currentView = 'login';
    renderView();
    return;
  }

  if (cartItems.length === 0) return;

  const checkoutButton = document.getElementById('checkout-btn') as HTMLButtonElement | null;
  if (checkoutButton) {
    checkoutButton.disabled = true;
    checkoutButton.textContent = 'Processing...';
  }

  try {
    for (const item of cartItems) {
      await submitOrder({ productId: item.id, quantity: item.quantity });
    }

    cartItems.length = 0;
    currentPage = 0;
    currentView = 'orders';
    renderView();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed.';
    const checkoutMessage = document.getElementById('checkout-message');
    if (checkoutMessage) {
      checkoutMessage.textContent = message;
      checkoutMessage.className = 'error-state';
    }
    if (checkoutButton) {
      checkoutButton.disabled = false;
      checkoutButton.textContent = 'Checkout';
    }
  }
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
    saveUserSession(token, profile.name ?? email, profile.role ?? 'USER');
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
          ${isAdmin() ? '<a href="#" data-view="dashboard">Admin dashboard</a>' : ''}
          <a href="#" data-view="products">Products</a>
          ${isAdmin() ? '<a href="#" data-view="admin-products">Manage products</a>' : ''}
          ${isAdmin() ? '<a href="#" data-view="admin-orders">Manage orders</a>' : ''}
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
        <h1>Admin dashboard</h1>
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

}

function renderAdminProducts() {
  return `
    <div class="page-container form-container">
      <div class="auth-card product-form-card">
        <p class="auth-kicker">Catalog management</p>
        <h1>Add a product</h1>
        <p class="form-note">Create inventory that customers can purchase immediately.</p>
        <form class="auth-form" id="product-form">
          <label>
            Product name
            <input name="name" type="text" placeholder="Wireless keyboard" required />
          </label>
          <label>
            Description
            <textarea name="description" rows="3" placeholder="Short product description" required></textarea>
          </label>
          <div class="form-row">
            <label>
              Price
              <input name="price" type="number" min="0.01" step="0.01" placeholder="49.99" required />
            </label>
            <label>
              Stock
              <input name="stock" type="number" min="1" step="1" placeholder="20" required />
            </label>
          </div>
          <label>
            JPG image URL
            <input name="imageUrl" type="url" placeholder="https://example.com/product.jpg" required />
          </label>
          <div id="product-form-message" class="empty-state"></div>
          <button type="submit" class="primary-btn">Save product</button>
        </form>
      </div>
    </div>
  `;
}

function renderAdminOrders() {
  return `
    <div class="page-container">
      <header class="topbar">
        <h1>Manage orders</h1>
        <span class="chip">Admin only</span>
      </header>
      <section class="orders-panel">
        <div id="admin-orders-container" class="orders-table">
          <div class="empty-state">Loading customer orders...</div>
        </div>
      </section>
    </div>
  `;
}

async function loadAdminOrders() {
  const container = document.getElementById('admin-orders-container');
  if (!container) return;

  try {
    const page = await fetchAdminOrders();
    container.innerHTML = `
      <div class="table-head table-row admin-order-row">
        <span>Order</span>
        <span>Customer</span>
        <span>Total</span>
        <span>Status</span>
      </div>
      ${page.content.map((order) => `
        <div class="table-row admin-order-row">
          <span>#${order.orderId}</span>
          <span>${order.userEmail}</span>
          <span>$${Number(order.total || 0).toFixed(2)}</span>
          <select class="status-select" data-order-id="${order.orderId}">
            ${['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
              .map((status) => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`)
              .join('')}
          </select>
        </div>
      `).join('') || '<div class="empty-state">No customer orders found.</div>'}
    `;

    container.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', async (event) => {
        const target = event.currentTarget as HTMLSelectElement;
        target.disabled = true;
        try {
          await updateOrderStatus(Number(target.dataset.orderId), target.value);
        } catch (error) {
          target.classList.add('status-error');
        } finally {
          target.disabled = false;
        }
      });
    });
  } catch (error) {
    container.innerHTML = `<div class="error-state">${error instanceof Error ? error.message : 'Failed to load admin orders.'}</div>`;
  }
}

function bindProductButtons() {
  document.querySelectorAll('.add-to-cart-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = Number((button as HTMLElement).dataset.productId);
      addToCart(productId);
    });
  });
}

async function loadProductsForView(pageRoot: HTMLElement) {
  try {
    catalog = await fetchProducts();
    pageRoot.innerHTML = renderProducts();
    bindProductButtons();
  } catch (error) {
    pageRoot.innerHTML = `<div class="error-state">${error instanceof Error ? error.message : 'Failed to load products.'}</div>`;
  }
}

function renderCartPage() {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return `
    <div class="page-container">
      <header class="topbar">
        <h1>Cart</h1>
        <button id="checkout-btn" class="primary-btn" type="button" ${cartItems.length === 0 ? 'disabled' : ''}>Checkout</button>
      </header>

      <div id="checkout-message" class="empty-state"></div>

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
    pageRoot.innerHTML = '<div class="empty-state">Loading products...</div>';
    void loadProductsForView(pageRoot);
    return;
  }

  if (currentView === 'admin-products') {
    if (!isAdmin()) {
      pageRoot.innerHTML = '<div class="error-state">Admin access is required to manage products.</div>';
      return;
    }
    pageRoot.innerHTML = renderAdminProducts();
    const form = document.getElementById('product-form') as HTMLFormElement | null;
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = document.getElementById('product-form-message');

      try {
        await createProduct(form);
        catalog = await fetchProducts();
        form.reset();
        if (message) {
          message.textContent = 'Product saved. It is now available in the storefront.';
          message.className = 'success-state';
        }
      } catch (error) {
        if (message) {
          message.textContent = error instanceof Error ? error.message : 'Product creation failed.';
          message.className = 'error-state';
        }
      }
    });
    return;
  }

  if (currentView === 'admin-orders') {
    if (!isAdmin()) {
      pageRoot.innerHTML = '<div class="error-state">Admin access is required to manage orders.</div>';
      return;
    }
    pageRoot.innerHTML = renderAdminOrders();
    void loadAdminOrders();
    return;
  }

  if (currentView === 'cart') {
    pageRoot.innerHTML = renderCartPage();
    document.getElementById('checkout-btn')?.addEventListener('click', () => void handleCheckout());
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
          <span>#${order.orderId}</span>
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
