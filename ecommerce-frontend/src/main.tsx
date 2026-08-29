import './index.css';

const app = document.getElementById('app');

const orders = [
  { id: 101, status: 'Paid', total: 129.99, items: 2 },
  { id: 102, status: 'Pending', total: 89.0, items: 1 },
  { id: 103, status: 'Shipped', total: 245.5, items: 3 },
];

if (app) {
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
            <strong>3</strong>
          </div>
          <div class="summary-card">
            <span>Pending</span>
            <strong>1</strong>
          </div>
          <div class="summary-card">
            <span>Revenue</span>
            <strong>$464.49</strong>
          </div>
        </section>

        <section class="orders-panel">
          <div class="panel-header">
            <h2>Recent Orders</h2>
          </div>

          <div class="orders-table">
            <div class="table-head table-row">
              <span>Order ID</span>
              <span>Status</span>
              <span>Total</span>
              <span>Items</span>
            </div>

            ${orders
              .map(
                (order) => `
                  <div class="table-row">
                    <span>#${order.id}</span>
                    <span class="status-pill">${order.status}</span>
                    <span>$${order.total.toFixed(2)}</span>
                    <span>${order.items}</span>
                  </div>
                `,
              )
              .join('')}
          </div>
        </section>
      </main>
    </div>
  `;
}
