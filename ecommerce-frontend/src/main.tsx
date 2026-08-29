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
let currentPage = 0;
let pageSize = 5;
let sortField = 'createdAt';
let sortDirection = 'desc';

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

function renderShell() {
  if (!app) return;

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">ShopFlow</div>
        <nav class="nav">
          <a href="#">Dashboard</a>
          <a href="#">Products</a>
          <a href="#" class="active">Orders</a>
          <a href="#">Profile</a>
        </nav>
      </aside>

      <main class="main-panel">
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
      </main>
    </div>
  `;

  const sortSelect = document.getElementById('sort-select');
  const pageSizeSelect = document.getElementById('page-size-select');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

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

  if (prevBtn) {
    prevBtn.disabled = (pageData?.number ?? 0) === 0;
  }

  if (nextBtn) {
    nextBtn.disabled = (pageData?.number ?? 0) >= (pageData?.totalPages ?? 1) - 1;
  }
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
loadOrders();
