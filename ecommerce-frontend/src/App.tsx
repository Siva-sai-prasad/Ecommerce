import './App.css';
import { useEffect, useState } from 'react';
import { fetchOrdersPage, type OrdersPage } from './api';

function App() {
  const [ordersPage, setOrdersPage] = useState<OrdersPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const page = await fetchOrdersPage(0, 10);
        setOrdersPage(page);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        setLoading(false);
      }
    }

    void loadOrders();
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">ShopFlow</div>
        <nav className="nav">
          <a href="#">Dashboard</a>
          <a href="#">Products</a>
          <a href="#">Orders</a>
          <a href="#">Profile</a>
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <h1>Orders</h1>
          <button type="button" className="primary-btn">
            New Order
          </button>
        </header>

        <section className="summary-grid">
          <div className="summary-card">
            <span>Total Orders</span>
            <strong>{ordersPage?.totalElements ?? 0}</strong>
          </div>
          <div className="summary-card">
            <span>Pages</span>
            <strong>{ordersPage?.totalPages ?? 0}</strong>
          </div>
          <div className="summary-card">
            <span>Current Page</span>
            <strong>{(ordersPage?.number ?? 0) + 1}</strong>
          </div>
        </section>

        <section className="orders-panel">
          <div className="panel-header">
            <h2>Recent orders</h2>
          </div>

          {loading ? (
            <p>Loading orders...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <div className="orders-table">
              <div className="table-head table-row">
                <span>Order ID</span>
                <span>Status</span>
                <span>Total</span>
                <span>Items</span>
              </div>

              {ordersPage?.content.length ? (
                ordersPage.content.map((order) => (
                  <div className="table-row" key={order.id}>
                    <span>#{order.id}</span>
                    <span className="status-pill">{order.status}</span>
                    <span>${order.total.toFixed(2)}</span>
                    <span>{order.items.length}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state">No orders yet.</div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
