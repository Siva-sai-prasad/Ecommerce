import './index.css';

import freshVeggiesBanner from './assets/fresh veggies banner.png';
import electronicsBanner from './assets/electronics banner.png';
import groceriesBanner from './assets/groceries banner.png';
import nonVegBanner from './assets/non veg banner.png';

import groceriesLogo from './assets/groceries logo.png';
import freshVeggiesLogo from './assets/fresh veggies logo.png';
import electronicsLogo from './assets/electronics logo.png';
import nonVegLogo from './assets/non veg logo.png';

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
  originalPrice?: number;
  stock: number;
  tag: string;
  badge?: string;
  badgeType?: 'fresh' | 'discount' | 'offer';
  description: string;
  imageUrl: string;
  category?: string | null;
};

const AUTH_TOKEN_KEY = 'ecommerce.jwt';
const USER_NAME_KEY = 'ecommerce.userName';
const USER_ROLE_KEY = 'ecommerce.userRole';

// Initial curated catalog matching reference UI
const initialCatalog: Product[] = [
  {
    id: 1,
    name: 'Fresh Tomatoes',
    price: 49,
    originalPrice: 65,
    stock: 50,
    tag: 'Farm Fresh',
    badge: 'Fresh',
    badgeType: 'fresh',
    description: 'Crisp, ripe and handpicked farm fresh red tomatoes.',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    category: 'Fresh Veggies',
  },
  {
    id: 2,
    name: 'Smartphone Pro 5G',
    price: 14999,
    originalPrice: 18999,
    stock: 25,
    tag: 'Best Seller',
    badge: '-20%',
    badgeType: 'discount',
    description: 'High-performance AMOLED display with super-fast 5G processor.',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
    category: 'Electronics',
  },
  {
    id: 3,
    name: 'Ultra Slim Laptop',
    price: 42999,
    originalPrice: 50999,
    stock: 15,
    tag: 'Featured',
    badge: '-15%',
    badgeType: 'discount',
    description: 'Intel Core i7, 16GB RAM, lightning fast NVMe SSD for creators.',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
    category: 'Electronics',
  },
  {
    id: 4,
    name: 'Wireless ANC Headphones',
    price: 2499,
    originalPrice: 3299,
    stock: 40,
    tag: 'Trending',
    badge: '-25%',
    badgeType: 'discount',
    description: 'Active noise cancellation with 40-hour deep bass playback.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    category: 'Electronics',
  },
  {
    id: 5,
    name: 'Organic Farm Broccoli',
    price: 79,
    originalPrice: 99,
    stock: 35,
    tag: 'Organic',
    badge: 'Fresh',
    badgeType: 'fresh',
    description: 'Nutrient-rich, pesticide-free fresh green broccoli florets.',
    imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=600&q=80',
    category: 'Fresh Veggies',
  },
  {
    id: 6,
    name: 'Premium Basmati Rice (5kg)',
    price: 499,
    originalPrice: 620,
    stock: 60,
    tag: 'Essential',
    badge: '-18%',
    badgeType: 'discount',
    description: 'Aged long-grain royal basmati rice for fragrant biryani and meals.',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    category: 'Groceries',
  },
  {
    id: 7,
    name: 'Fresh Chicken Breast (500g)',
    price: 189,
    originalPrice: 220,
    stock: 30,
    tag: '100% Halal',
    badge: 'Fresh',
    badgeType: 'fresh',
    description: 'Tender, skinless and boneless high-protein chicken fillets.',
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80',
    category: 'Non Veg',
  },
  {
    id: 8,
    name: 'Cold Pressed Virgin Olive Oil',
    price: 749,
    originalPrice: 999,
    stock: 28,
    tag: 'Healthy',
    badge: '-25%',
    badgeType: 'discount',
    description: 'Imported pure cold-pressed extra virgin olive oil 1 Litre.',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
    category: 'Groceries',
  },
];

let catalog: Product[] = [...initialCatalog];
const cartItems: Array<{ id: number; name: string; price: number; quantity: number; imageUrl?: string }> = [];

let currentPage = 0;
let pageSize = 5;
let sortField = 'createdAt';
let sortDirection = 'desc';
let currentView: 'storefront' | 'orders' | 'dashboard' | 'admin-products' | 'admin-orders' = 'storefront';
let selectedCategory = 'All';
let searchQuery = '';
let isCartOpen = false;
let isAuthModalOpen = false;
let authMode: 'login' | 'signup' = 'login';
let authMessage = '';
let activeSlideIndex = 0;
let carouselTimer: number | undefined;
let ordersRefreshTimer: number | undefined;

// Admin Management State
let editingProduct: Product | null = null;
let adminOrdersPage = 0;
let adminOrdersSize = 10;
let adminOrdersSearch = '';
let adminOrdersStatus = '';

// Banner Data definition
const bannerSlides = [
  {
    id: 'fresh-veggies',
    badge: 'Farm Fresh 100% Organic',
    title: 'Fresh Groceries<br/>Healthy Living',
    desc: 'Farm fresh veggies, daily essentials and more — all in one place.',
    buttonText: 'Shop Now',
    category: 'Fresh Veggies',
    image: freshVeggiesBanner,
  },
  {
    id: 'electronics',
    badge: 'Mega Electronics Sale',
    title: 'Next-Gen Tech &<br/>Smart Gadgets',
    desc: 'Supercharge your daily workflow with top laptops, smartphones & audio gear.',
    buttonText: 'Shop Electronics',
    category: 'Electronics',
    image: electronicsBanner,
  },
  {
    id: 'groceries',
    badge: 'Pantry Specials',
    title: 'Daily Essentials &<br/>Gourmet Picks',
    desc: 'Premium grains, aromatic spices, cooking oils, and everyday staples.',
    buttonText: 'Shop Groceries',
    category: 'Groceries',
    image: groceriesBanner,
  },
  {
    id: 'non-veg',
    badge: 'Prime Cuts & Seafood',
    title: 'Fresh Non-Veg &<br/>Hygienic Cuts',
    desc: 'Farm-sourced tender chicken, meats, and fresh seafood delivered chilled.',
    buttonText: 'Shop Non-Veg',
    category: 'Non Veg',
    image: nonVegBanner,
  },
];

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

async function restoreSession() {
  if (!getStoredToken()) return;
  try {
    const profile = await fetchCurrentUser();
    saveUserSession(getStoredToken(), profile.name ?? getStoredUserName(), profile.role ?? getStoredUserRole());
  } catch {
    clearUserSession();
  }
}

// Resilient API Fetch Helper with Auto-Fallback
function getBackendBaseUrl(): string {
  const host = window.location.hostname || '127.0.0.1';
  return `http://${host}:8080`;
}

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const directPath = url.startsWith('/api') || url.startsWith('/auth') ? url : `/api${url}`;
  try {
    const res = await fetch(url, options);
    if (res.status === 404 || res.status === 502 || res.status === 504) {
      return await fetch(`${getBackendBaseUrl()}${directPath}`, options);
    }
    return res;
  } catch {
    return await fetch(`${getBackendBaseUrl()}${directPath}`, options);
  }
}

// API Calls
async function fetchCurrentUser() {
  const token = getStoredToken();
  const response = await apiFetch('/api/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Unable to load account');
  return response.json();
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await apiFetch('/api/products');
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const apiProducts: Array<{ id: number; name: string; price: number; stock: number; description: string; imageUrl: string; category?: string }> = await response.json();

    if (apiProducts.length === 0) return initialCatalog;

    return apiProducts.map((product, idx) => {
      const isFresh = product.category === 'Fresh Veggies' || product.category === 'Non Veg';
      const discounts = ['-20%', '-15%', '-25%', '-10%'];
      return {
        ...product,
        tag: ['Featured', 'Popular', 'New', 'Trending'][idx % 4],
        badge: isFresh ? 'Fresh' : discounts[idx % discounts.length],
        badgeType: isFresh ? 'fresh' : 'discount',
        originalPrice: Math.round(product.price * 1.25),
        category: product.category ?? 'Electronics',
      };
    });
  } catch {
    return initialCatalog;
  }
}

async function submitOrder(request: CreateOrderRequest) {
  const token = getStoredToken();
  const response = await apiFetch('/api/orders', {
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

async function fetchOrders(page = currentPage, size = pageSize): Promise<OrdersPage> {
  const url = `/api/orders?page=${page}&size=${size}&sort=${sortField},${sortDirection}`;
  const token = getStoredToken();

  const response = await apiFetch(url, {
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

async function fetchAdminDashboard() {
  const response = await apiFetch('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${getStoredToken()}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to load dashboard: ${response.status}`);
  }

  return response.json() as Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalCustomers: number;
    revenue: number;
  }>;
}

async function fetchAdminOrders(
  page = adminOrdersPage,
  size = adminOrdersSize,
  search = adminOrdersSearch,
  status = adminOrdersStatus,
): Promise<OrdersPage> {
  const token = getStoredToken();
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'createdAt,desc',
  });
  if (search.trim()) params.set('search', search.trim());
  if (status) params.set('status', status);
  const response = await apiFetch(`/api/admin/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to load admin orders: ${response.status}`);
  }

  return response.json();
}

async function updateOrderStatus(orderId: number, status: string): Promise<Order> {
  const response = await apiFetch(`/api/admin/orders/${orderId}/status`, {
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

  return response.json() as Promise<Order>;
}

async function createProduct(form: HTMLFormElement) {
  const formData = new FormData(form);
  const token = getStoredToken();
  const response = await apiFetch('/api/admin/products', {
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
      category: String(formData.get('category') ?? 'Electronics'),
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? `Product creation failed: ${response.status}`);
  }

  return response.json() as Promise<Product>;
}

async function updateProduct(productId: number, form: HTMLFormElement) {
  const formData = new FormData(form);
  const token = getStoredToken();
  const response = await apiFetch(`/api/admin/products/${productId}`, {
    method: 'PUT',
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
      category: String(formData.get('category') ?? 'Electronics'),
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? `Product update failed: ${response.status}`);
  }

  return response.json() as Promise<Product>;
}

async function deleteProduct(productId: number) {
  const response = await apiFetch(`/api/admin/products/${productId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? `Product deletion failed: ${response.status}`);
  }
}

// Toast System
function showToast(message: string) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Cart Management
function addToCart(productId: number) {
  const product = catalog.find((item) => item.id === productId);
  if (!product) return;

  const existing = cartItems.find((item) => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cartItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
    });
  }

  updateCartUI();
  showToast(`Added "${product.name}" to cart!`);

  // Animate button
  const btn = document.querySelector(`[data-product-id="${productId}"]`) as HTMLButtonElement | null;
  if (btn) {
    const originalText = btn.innerHTML;
    btn.classList.add('added');
    btn.innerHTML = `✓ Added`;
    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = originalText;
    }, 1200);
  }
}

function updateCartItemQty(productId: number, delta: number) {
  const itemIndex = cartItems.findIndex((item) => item.id === productId);
  if (itemIndex === -1) return;

  cartItems[itemIndex].quantity += delta;
  if (cartItems[itemIndex].quantity <= 0) {
    cartItems.splice(itemIndex, 1);
  }

  updateCartUI();
}

function updateCartUI() {
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const badge = document.getElementById('nav-cart-badge');
  if (badge) {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  const cartBody = document.getElementById('cart-drawer-body');
  const cartSubtotal = document.getElementById('cart-drawer-total');
  const checkoutBtn = document.getElementById('drawer-checkout-btn') as HTMLButtonElement | null;

  if (cartSubtotal) {
    cartSubtotal.textContent = formatCurrency(total);
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = cartItems.length === 0;
  }

  if (cartBody) {
    if (cartItems.length === 0) {
      cartBody.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin-bottom: 12px;">
            <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <p>Your shopping cart is empty.</p>
          <button class="slide-btn" style="margin-top: 14px;" onclick="window.closeCartDrawer()">Start Shopping</button>
        </div>
      `;
    } else {
      cartBody.innerHTML = cartItems
        .map(
          (item) => `
          <div class="cart-item-row">
            <div class="cart-item-info">
              <strong>${item.name}</strong>
              <span>${formatCurrency(item.price)} × ${item.quantity}</span>
            </div>
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="window.changeQty(${item.id}, -1)">−</button>
              <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
              <button class="qty-btn" onclick="window.changeQty(${item.id}, 1)">+</button>
            </div>
            <div style="font-weight: 800; color: var(--brand-navy); min-width: 70px; text-align: right;">
              ${formatCurrency(item.price * item.quantity)}
            </div>
          </div>
        `,
        )
        .join('');
    }
  }
}

// Window globals for inline onclicks in generated HTML
(window as unknown as { changeQty: (id: number, delta: number) => void }).changeQty = (id: number, delta: number) => {
  updateCartItemQty(id, delta);
};

(window as unknown as { closeCartDrawer: () => void }).closeCartDrawer = () => {
  toggleCartDrawer(false);
};

(window as unknown as { closeAuthModal: () => void }).closeAuthModal = () => {
  toggleAuthModal(false);
};

(window as unknown as { selectCategoryShortcut: (cat: string) => void }).selectCategoryShortcut = (cat: string) => {
  filterByCategory(cat);
};

function toggleCartDrawer(open?: boolean) {
  isCartOpen = open !== undefined ? open : !isCartOpen;
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer && overlay) {
    drawer.classList.toggle('active', isCartOpen);
    overlay.classList.toggle('active', isCartOpen);
  }
  if (isCartOpen) updateCartUI();
}

function toggleAuthModal(open?: boolean) {
  isAuthModalOpen = open !== undefined ? open : !isAuthModalOpen;
  const modal = document.getElementById('auth-modal-overlay');
  if (modal) {
    modal.classList.toggle('active', isAuthModalOpen);
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `₹${amount}`;
}

// Carousel controls
function goToSlide(index: number) {
  activeSlideIndex = (index + bannerSlides.length) % bannerSlides.length;
  const track = document.getElementById('carousel-track');
  if (track) {
    track.style.transform = `translateX(-${activeSlideIndex * 100}%)`;
  }
  document.querySelectorAll('.carousel-dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx === activeSlideIndex);
  });
}

function startCarouselTimer() {
  stopCarouselTimer();
  carouselTimer = window.setInterval(() => {
    goToSlide(activeSlideIndex + 1);
  }, 5000);
}

function stopCarouselTimer() {
  if (carouselTimer !== undefined) {
    window.clearInterval(carouselTimer);
    carouselTimer = undefined;
  }
}

// Checkout action
async function handleDrawerCheckout() {
  if (!isLoggedIn()) {
    toggleCartDrawer(false);
    authMode = 'login';
    authMessage = 'Please sign in to complete your checkout.';
    renderAuthModalContent();
    toggleAuthModal(true);
    return;
  }

  if (cartItems.length === 0) return;

  const btn = document.getElementById('drawer-checkout-btn') as HTMLButtonElement | null;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Processing Order...';
  }

  try {
    for (const item of cartItems) {
      await submitOrder({ productId: item.id, quantity: item.quantity });
    }

    cartItems.length = 0;
    updateCartUI();
    toggleCartDrawer(false);
    showToast('🎉 Order placed successfully! Thank you for shopping with NexCart.');
    currentView = 'orders';
    renderView();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed.';
    showToast(`Error: ${msg}`);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Proceed to Checkout';
    }
  }
}

// Category filter
function filterByCategory(categoryName: string) {
  selectedCategory = categoryName;
  currentView = 'storefront';
  renderView();

  // Scroll to deals section smoothly if user clicked on banner/shortcut
  const dealsSection = document.getElementById('deals-section');
  if (dealsSection) {
    dealsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Top Nav Rendering
function renderNavbar() {
  return `
    <header class="navbar">
      <div class="nav-container">
        <!-- NexCart Brand Logo -->
        <div class="brand-logo-link" id="nav-brand-logo">
          <div class="logo-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div class="brand-title">Nex<span>Cart</span></div>
        </div>

        <!-- Centered Search Bar -->
        <div class="search-wrapper">
          <span class="search-icon-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            id="global-search-input"
            type="search"
            class="search-input-box"
            placeholder="Search for groceries, electronics, more..."
            value="${searchQuery}"
          />
          ${searchQuery ? '<button id="search-clear-btn" class="search-clear-btn">✕</button>' : ''}
        </div>

        <!-- Nav Actions -->
        <div class="nav-actions">
          ${isAdmin() ? '<span class="admin-nav-pill">Admin</span>' : ''}

          <!-- Cart Button -->
          <button id="nav-cart-trigger" class="nav-icon-btn nav-cart-btn" type="button" aria-label="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span id="nav-cart-badge" class="cart-counter" ${cartItems.length === 0 ? 'hidden' : ''}>${cartItems.reduce((s, i) => s + i.quantity, 0)}</span>
          </button>

          <!-- Profile / Auth Button -->
          <button id="nav-profile-trigger" class="nav-icon-btn" type="button" aria-label="Account">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${isLoggedIn() ? getStoredUserName() : 'Sign In'}</span>
          </button>
        </div>
      </div>
    </header>
  `;
}

// Left Category Sidebar
function renderSidebar() {
  const categories = [
    {
      id: 'All',
      label: 'All Categories',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    },
    {
      id: 'Groceries',
      label: 'Groceries',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
    },
    {
      id: 'Fresh Veggies',
      label: 'Fresh Vegetables',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.2A7 7 0 0 1 11 20z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>`,
    },
    {
      id: 'Electronics',
      label: 'Electronics',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
    },
    {
      id: 'Non Veg',
      label: 'Non-Veg',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 3v18"></path><path d="M3 12h18"></path></svg>`,
    },
    {
      id: 'Offers',
      label: 'Offers',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
    },
  ];

  return `
    <aside class="category-sidebar">
      <div class="sidebar-title">
        <span>Categories</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="14" y2="12"></line><line x1="4" y1="18" x2="18" y2="18"></line></svg>
      </div>
      <nav class="sidebar-nav">
        ${categories
      .map(
        (cat) => `
          <button
            class="sidebar-item ${selectedCategory === cat.id && currentView === 'storefront' ? 'active' : ''}"
            data-category="${cat.id}"
            type="button"
          >
            <span class="sidebar-icon">${cat.icon}</span>
            <span>${cat.label}</span>
          </button>
        `,
      )
      .join('')}

        <div class="sidebar-divider"></div>

        <button class="sidebar-item ${currentView === 'orders' ? 'active' : ''}" data-view="orders" type="button">
          <span class="sidebar-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </span>
          <span>My Orders</span>
        </button>

        ${isAdmin()
      ? `
          <div class="sidebar-divider"></div>
          <div class="sidebar-title" style="padding-top: 4px;">Admin Portal</div>
          <button class="sidebar-item ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard" type="button">
            <span class="sidebar-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            </span>
            <span>Dashboard</span>
          </button>
          <button class="sidebar-item ${currentView === 'admin-products' ? 'active' : ''}" data-view="admin-products" type="button">
            <span class="sidebar-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            </span>
            <span>Manage Products</span>
          </button>
          <button class="sidebar-item ${currentView === 'admin-orders' ? 'active' : ''}" data-view="admin-orders" type="button">
            <span class="sidebar-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
            </span>
            <span>Manage Orders</span>
          </button>
        `
      : ''
    }

        ${isLoggedIn()
      ? `
          <div class="sidebar-divider"></div>
          <button class="sidebar-item" id="sidebar-logout-btn" type="button" style="color: #ef4444;">
            <span class="sidebar-icon" style="color: #ef4444;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </span>
            <span>Logout</span>
          </button>
        `
      : ''
    }
      </nav>
    </aside>
  `;
}

// Banner Carousel
function renderCarousel() {
  return `
    <div class="banner-carousel-container" id="banner-carousel">
      <div class="carousel-slides-track" id="carousel-track">
        ${bannerSlides
      .map(
        (slide) => `
          <div class="carousel-slide" data-target-category="${slide.category}">
            <img class="slide-image" src="${slide.image}" alt="${slide.title.replace('<br/>', ' ')}" />
            <div class="slide-overlay">
              <span class="slide-badge">${slide.badge}</span>
              <h2 class="slide-title">${slide.title}</h2>
              <p class="slide-desc">${slide.desc}</p>
              <button class="slide-btn" type="button" data-target-category="${slide.category}">
                ${slide.buttonText}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
          </div>
        `,
      )
      .join('')}
      </div>

      <!-- Arrow Controls -->
      <button id="carousel-prev" class="carousel-nav-btn carousel-prev-btn" type="button" aria-label="Previous Slide">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button id="carousel-next" class="carousel-nav-btn carousel-next-btn" type="button" aria-label="Next Slide">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>

      <!-- Dots -->
      <div class="carousel-dots">
        ${bannerSlides
      .map(
        (_, idx) => `
          <button class="carousel-dot ${idx === activeSlideIndex ? 'active' : ''}" data-slide-index="${idx}" type="button" aria-label="Slide ${idx + 1}"></button>
        `,
      )
      .join('')}
      </div>
    </div>
  `;
}

// Category Shortcuts
function renderCategoryShortcuts() {
  const shortcuts = [
    { name: 'Groceries', category: 'Groceries', icon: groceriesLogo, tintClass: 'bg-tint-groceries' },
    { name: 'Vegetables', category: 'Fresh Veggies', icon: freshVeggiesLogo, tintClass: 'bg-tint-veggies' },
    { name: 'Electronics', category: 'Electronics', icon: electronicsLogo, tintClass: 'bg-tint-electronics' },
    { name: 'Non-Veg', category: 'Non Veg', icon: nonVegLogo, tintClass: 'bg-tint-nonveg' },
  ];

  return `
    <section class="category-shortcuts-section">
      <div class="shortcuts-grid">
        ${shortcuts
      .map(
        (sc) => `
          <button class="shortcut-card ${selectedCategory === sc.category ? 'active' : ''}" onclick="window.selectCategoryShortcut('${sc.category}')" type="button">
            <div class="shortcut-icon-circle ${sc.tintClass}">
              <img src="${sc.icon}" alt="${sc.name}" />
            </div>
            <span class="shortcut-label">${sc.name}</span>
          </button>
        `,
      )
      .join('')}
      </div>
    </section>
  `;
}

// Best Deals & Products Grid
function renderDealsGrid() {
  let filtered = catalog;

  if (selectedCategory === 'Offers') {
    filtered = catalog.filter((p) => p.badgeType === 'discount' || p.badgeType === 'offer');
  } else if (selectedCategory !== 'All') {
    filtered = catalog.filter((p) => (p.category ?? 'Electronics') === selectedCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q),
    );
  }

  const headingText =
    searchQuery.trim()
      ? `Search results for "${searchQuery}"`
      : selectedCategory === 'All'
        ? 'Best Deals for You'
        : `${selectedCategory} Deals`;

  return `
    <section id="deals-section">
      <div class="section-header">
        <h2 class="section-title">
          ${headingText}
        </h2>
        ${selectedCategory !== 'All' || searchQuery
      ? `<button class="view-all-link" onclick="window.selectCategoryShortcut('All')">View All Products →</button>`
      : `<button class="view-all-link" onclick="window.selectCategoryShortcut('Offers')">View All Deals →</button>`
    }
      </div>

      <div class="products-grid">
        ${filtered
      .map((product) => {
        const badgeClass =
          product.badgeType === 'fresh'
            ? 'badge-fresh'
            : product.badgeType === 'offer'
              ? 'badge-offer'
              : 'badge-discount';
        const badgeText = product.badge ?? (product.category === 'Fresh Veggies' ? 'Fresh' : '-15%');

        return `
            <div class="product-card">
              <span class="badge-tag ${badgeClass}">${badgeText}</span>
              <div class="product-image-wrap">
                <img class="product-img" src="${product.imageUrl}" alt="${product.name}" loading="lazy" />
              </div>
              <span class="product-cat-label">${product.category ?? 'Store'}</span>
              <h3 class="product-name" title="${product.name}">${product.name}</h3>
              <p class="product-desc">${product.description}</p>
              <div class="product-bottom-row">
                <div class="price-box">
                  <span class="current-price">${formatCurrency(product.price)}${product.category === 'Fresh Veggies' && product.price < 200 ? '/kg' : ''}</span>
                  ${product.originalPrice ? `<span class="original-price">${formatCurrency(product.originalPrice)}</span>` : ''}
                </div>
                <button class="add-btn add-to-cart-btn" data-product-id="${product.id}" type="button">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Add
                </button>
              </div>
            </div>
          `;
      })
      .join('')}
      </div>
      ${filtered.length === 0 ? '<div class="empty-state">No matching items found in this category. Try another search or filter.</div>' : ''}
    </section>
  `;
}

// Slogan Strip
function renderSloganStrip() {
  return `
    <div class="slogan-strip">
      <p class="slogan-text">Vibe: <span>Fresh</span> • Modern • <span>Reliable</span></p>
    </div>
  `;
}

// Footer
function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="footer-container">
        <div class="footer-top-grid">
          <div class="footer-brand">
            <h3>Nex<span>Cart</span></h3>
            <p>Your one-stop digital hypermarket delivering ultra-fresh produce, groceries, and next-gen electronics straight to your doorstep.</p>
            <div class="footer-badges">
              <span class="trust-badge">⚡ 10-Min Fast Delivery</span>
              <span class="trust-badge">🛡️ 100% Quality Assured</span>
              <span class="trust-badge">💳 Secure Checkout</span>
            </div>
          </div>

          <div class="footer-col">
            <h4>Quick Links</h4>
            <ul class="footer-links">
              <li><a onclick="window.selectCategoryShortcut('All')">Home & Storefront</a></li>
              <li><a onclick="window.selectCategoryShortcut('Offers')">Today's Deals</a></li>
              <li><a id="footer-orders-link">Order Tracking</a></li>
              <li><a id="footer-cart-link">Shopping Cart</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Categories</h4>
            <ul class="footer-links">
              <li><a onclick="window.selectCategoryShortcut('Fresh Veggies')">Fresh Vegetables</a></li>
              <li><a onclick="window.selectCategoryShortcut('Groceries')">Daily Groceries</a></li>
              <li><a onclick="window.selectCategoryShortcut('Electronics')">Electronics & Gadgets</a></li>
              <li><a onclick="window.selectCategoryShortcut('Non Veg')">Meat & Seafood</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Customer Support</h4>
            <ul class="footer-links">
              <li><a>24/7 Helpline: +1 (800) 888-NEX</a></li>
              <li><a>support@nexcart.com</a></li>
              <li><a>Return & Refund Policy</a></li>
              <li><a>Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} NexCart Inc. All rights reserved.</span>
          <span>Fresh • Modern • Reliable</span>
        </div>
      </div>
    </footer>
  `;
}

// Cart Drawer & Modals HTML
function renderModalsAndDrawers() {
  return `
    <!-- Cart Overlay & Drawer -->
    <div id="cart-overlay" class="modal-overlay" onclick="window.closeCartDrawer()"></div>
    <div id="cart-drawer" class="cart-drawer">
      <div class="cart-header">
        <h2>Your Shopping Cart</h2>
        <button class="close-btn" onclick="window.closeCartDrawer()" aria-label="Close cart">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div id="cart-drawer-body" class="cart-body"></div>
      <div class="cart-footer">
        <div class="cart-summary-row">
          <span>Subtotal</span>
          <strong id="cart-drawer-total">₹0</strong>
        </div>
        <button id="drawer-checkout-btn" class="checkout-btn" type="button">
          Proceed to Checkout
        </button>
      </div>
    </div>

    <!-- Auth Modal Overlay -->
    <div id="auth-modal-overlay" class="modal-overlay">
      <div class="auth-modal-card">
        <button class="close-btn" onclick="window.closeAuthModal()" style="position: absolute; top: 16px; right: 16px; color: var(--text-muted);" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div id="auth-modal-inner"></div>
      </div>
    </div>
  `;
}

function renderAuthModalContent() {
  const container = document.getElementById('auth-modal-inner');
  if (!container) return;

  const isLogin = authMode === 'login';

  container.innerHTML = `
    <div class="auth-header">
      <h2>${isLogin ? 'Welcome Back' : 'Create Account'}</h2>
      <p>${isLogin ? 'Sign in to access your cart, orders and discounts' : 'Join NexCart for member-only flash deals'}</p>
    </div>

    ${authMessage ? `<div style="background: ${authMessage.includes('successfully') ? '#dcfce7' : '#fee2e2'}; color: ${authMessage.includes('successfully') ? '#15803d' : '#b91c1c'}; padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 16px; border: 1px solid ${authMessage.includes('successfully') ? '#bbf7d0' : '#fecaca'};">${authMessage}</div>` : ''}

    <form id="auth-modal-form">
      ${!isLogin
      ? `
        <div class="form-group">
          <label>Full Name</label>
          <input class="form-input" name="name" type="text" placeholder="John Doe" required />
        </div>
      `
      : ''
    }

      <div class="form-group">
        <label>Email Address</label>
        <input class="form-input" name="email" type="email" placeholder="name@example.com" required />
      </div>

      <div class="form-group">
        <label>Password</label>
        <input class="form-input" name="password" type="password" placeholder="••••••••" required />
      </div>

      <button type="submit" id="auth-submit-btn" class="form-submit-btn">
        ${isLogin ? 'Sign In' : 'Create NexCart Account'}
      </button>

      <div class="auth-toggle-link">
        ${isLogin ? "Don't have an account?" : 'Already have an account?'}
        <button type="button" id="auth-toggle-mode-btn">
          ${isLogin ? 'Sign Up' : 'Sign In'}
        </button>
      </div>
    </form>
  `;

  document.getElementById('auth-toggle-mode-btn')?.addEventListener('click', () => {
    authMode = authMode === 'login' ? 'signup' : 'login';
    authMessage = '';
    renderAuthModalContent();
  });

  document.getElementById('auth-modal-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const submitBtn = document.getElementById('auth-submit-btn') as HTMLButtonElement | null;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Please wait...';
    }

    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();
    const name = String(formData.get('name') ?? '').trim();

    try {
      if (authMode === 'signup') {
        const signupRes = await apiFetch('/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const signupPayload = await signupRes.json().catch(() => ({}));
        if (!signupRes.ok) {
          const msg =
            signupRes.status === 409 ||
              (signupPayload.detail && signupPayload.detail.includes('exists')) ||
              (signupPayload.message && signupPayload.message.includes('exists'))
              ? 'This email is already registered. Please sign in instead.'
              : (signupPayload.detail ?? signupPayload.message ?? signupPayload.title ?? 'Signup failed');
          throw new Error(msg);
        }
      }

      // Login to get token
      const loginRes = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginPayload = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) {
        const msg =
          loginRes.status === 401
            ? 'Invalid email or password. Please check your credentials.'
            : (loginPayload.detail ?? loginPayload.message ?? loginPayload.title ?? 'Login failed');
        throw new Error(msg);
      }

      const token = loginPayload.token;
      if (!token) throw new Error('No authentication token received');

      saveUserSession(token, email, 'USER');
      try {
        const profile = await fetchCurrentUser();
        saveUserSession(token, profile.name ?? name ?? email, profile.role ?? 'USER');
      } catch {
        // Fallback to name or email
      }

      authMessage = '';
      toggleAuthModal(false);
      showToast(`Welcome to NexCart, ${name || email}! 🎉`);
      renderView();
    } catch (err) {
      authMessage = err instanceof Error ? err.message : 'Authentication failed';
      renderAuthModalContent();
    }
  });
}

// Orders View
function renderOrdersView() {
  return `
    <div class="admin-card">
      <div class="section-header" style="margin-bottom: 24px;">
        <h2 class="section-title">My Order History</h2>
        <button class="add-btn" onclick="window.selectCategoryShortcut('All')" type="button">Continue Shopping</button>
      </div>

      <div class="admin-grid-3">
        <div class="metric-card">
          <span>Total Element Count</span>
          <strong id="total-orders-count">0</strong>
        </div>
        <div class="metric-card">
          <span>Total Pages</span>
          <strong id="total-pages-count">0</strong>
        </div>
        <div class="metric-card">
          <span>Current Active Page</span>
          <strong id="current-orders-page">1</strong>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Status</th>
              <th>Total</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody id="orders-table-body">
            <tr><td colspan="4" style="text-align: center; padding: 24px;">Loading orders...</td></tr>
          </tbody>
        </table>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px;">
        <button id="prev-orders-btn" class="add-btn" type="button">Previous</button>
        <span id="orders-page-indicator" style="font-weight: 700; color: var(--text-navy);">Page 1</span>
        <button id="next-orders-btn" class="add-btn" type="button">Next</button>
      </div>
    </div>
  `;
}

async function loadOrdersData() {
  try {
    const pageData = await fetchOrders(currentPage, pageSize);
    const tbody = document.getElementById('orders-table-body');
    const totalOrdersEl = document.getElementById('total-orders-count');
    const totalPagesEl = document.getElementById('total-pages-count');
    const currentOrdersPageEl = document.getElementById('current-orders-page');
    const indicator = document.getElementById('orders-page-indicator');
    const prevBtn = document.getElementById('prev-orders-btn') as HTMLButtonElement | null;
    const nextBtn = document.getElementById('next-orders-btn') as HTMLButtonElement | null;

    if (totalOrdersEl) totalOrdersEl.textContent = String(pageData.totalElements);
    if (totalPagesEl) totalPagesEl.textContent = String(pageData.totalPages);
    if (currentOrdersPageEl) currentOrdersPageEl.textContent = String(pageData.number + 1);
    if (indicator) indicator.textContent = `Page ${pageData.number + 1} of ${Math.max(1, pageData.totalPages)}`;

    if (prevBtn) prevBtn.disabled = pageData.number === 0;
    if (nextBtn) nextBtn.disabled = pageData.number >= pageData.totalPages - 1;

    if (tbody) {
      if (pageData.content.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 32px;">No orders found yet. Start shopping on NexCart!</td></tr>`;
      } else {
        tbody.innerHTML = pageData.content
          .map(
            (o) => `
            <tr>
              <td><strong>#${o.orderId}</strong></td>
              <td><span class="status-badge status-${o.status}">${o.status}</span></td>
              <td><strong>${formatCurrency(o.total)}</strong></td>
              <td>${o.items?.length ?? 0} items</td>
            </tr>
          `,
          )
          .join('');
      }
    }
  } catch (err) {
    const tbody = document.getElementById('orders-table-body');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444; padding: 24px;">${err instanceof Error ? err.message : 'Failed to load orders.'}</td></tr>`;
    }
  }
}

// Admin Dashboard View
function renderDashboardView() {
  return `
    <div class="admin-card">
      <div class="section-header">
        <h2 class="section-title">Storefront Analytics & Dashboard</h2>
        <span class="status-badge status-DELIVERED">Live Metrics</span>
      </div>

      <div class="admin-grid-3">
        <div class="metric-card" style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);">
          <span>Gross Revenue</span>
          <strong id="metric-revenue" style="color: var(--brand-orange);">Loading...</strong>
        </div>
        <div class="metric-card">
          <span>Total Orders</span>
          <strong id="metric-orders">Loading...</strong>
        </div>
        <div class="metric-card">
          <span>Registered Customers</span>
          <strong id="metric-customers">Loading...</strong>
        </div>
      </div>
    </div>
  `;
}

async function loadDashboardData() {
  try {
    const data = await fetchAdminDashboard();
    const rev = document.getElementById('metric-revenue');
    const ord = document.getElementById('metric-orders');
    const cust = document.getElementById('metric-customers');
    if (rev) rev.textContent = formatCurrency(data.revenue);
    if (ord) ord.textContent = String(data.totalOrders);
    if (cust) cust.textContent = String(data.totalCustomers);
  } catch (err) {
    showToast(`Dashboard error: ${err instanceof Error ? err.message : 'Failed to load'}`);
  }
}

// Admin Products View
function renderAdminProductsView() {
  const isEditing = Boolean(editingProduct);
  return `
    <div class="admin-card">
      <div class="section-header" style="margin-bottom: 20px;">
        <h2 class="section-title">${isEditing ? `✏️ Edit Product #${editingProduct?.id}` : '➕ Catalog Management: Add New Product'}</h2>
        ${isEditing ? `<span class="status-badge status-PROCESSING">Editing Mode</span>` : `<span class="status-badge status-DELIVERED">Product Creation</span>`}
      </div>

      <form id="admin-product-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
        <div class="form-group">
          <label>Product Name</label>
          <input class="form-input" name="name" type="text" placeholder="e.g. Organic Avocados" value="${editingProduct ? editingProduct.name : ''}" required />
        </div>
        <div class="form-group">
          <label>Category</label>
          <select class="form-input" name="category" required>
            <option value="Fresh Veggies" ${editingProduct?.category === 'Fresh Veggies' ? 'selected' : ''}>Fresh Veggies</option>
            <option value="Groceries" ${editingProduct?.category === 'Groceries' ? 'selected' : ''}>Groceries</option>
            <option value="Electronics" ${editingProduct?.category === 'Electronics' ? 'selected' : ''}>Electronics</option>
            <option value="Non Veg" ${editingProduct?.category === 'Non Veg' ? 'selected' : ''}>Non Veg</option>
          </select>
        </div>
        <div class="form-group">
          <label>Price (₹)</label>
          <input class="form-input" name="price" type="number" min="1" step="0.01" placeholder="49.99" value="${editingProduct ? editingProduct.price : ''}" required />
        </div>
        <div class="form-group">
          <label>Stock Quantity</label>
          <input class="form-input" name="stock" type="number" min="1" step="1" placeholder="50" value="${editingProduct ? editingProduct.stock : ''}" required />
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span>Product Image (Upload or URL)</span>
            <span style="font-size: 11px; font-weight: 500; color: var(--text-muted);">Choose a file from device or provide an image link</span>
          </label>
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <label class="upload-trigger-btn" style="cursor: pointer;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <span>📁 Upload from Device</span>
              <input type="file" id="product-file-input" class="file-upload-input" accept="image/*" />
            </label>
            <input id="product-image-url-input" class="form-input" name="imageUrl" type="text" placeholder="Or enter image URL (https://...)" value="${editingProduct ? editingProduct.imageUrl : ''}" style="flex: 1; min-width: 240px;" required />
          </div>
          <div id="image-preview-wrapper" style="margin-top: 12px; display: ${editingProduct?.imageUrl ? 'flex' : 'none'}; align-items: center; gap: 12px;">
            <div class="image-preview-thumb">
              <img id="image-preview-img" src="${editingProduct?.imageUrl ?? ''}" alt="Product Preview" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" />
            </div>
            <span style="font-size: 12px; font-weight: 600; color: var(--text-muted);" id="image-preview-caption">${editingProduct ? 'Current Product Image' : 'Image Preview'}</span>
          </div>
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label>Description</label>
          <textarea class="form-input" name="description" rows="2" placeholder="Brief description of product..." required>${editingProduct ? editingProduct.description : ''}</textarea>
        </div>

        <div style="grid-column: 1 / -1; display: flex; gap: 12px;">
          <button type="submit" class="form-submit-btn" style="flex: 1;">
            ${isEditing ? '💾 Update Product' : '➕ Save New Product'}
          </button>
          ${isEditing ? `<button type="button" id="cancel-edit-product-btn" class="cancel-edit-btn">❌ Cancel Edit</button>` : ''}
        </div>
      </form>

      <div class="section-header" style="margin-bottom: 16px;">
        <h2 class="section-title">Current Catalog Items</h2>
        <span style="font-size: 0.88rem; font-weight: 600; color: var(--text-muted);" id="admin-catalog-count">Loading...</span>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="admin-products-table-body">
            <tr><td colspan="6" style="text-align: center; padding: 20px;">Loading products...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function loadAdminProductsData() {
  const tbody = document.getElementById('admin-products-table-body');
  const countEl = document.getElementById('admin-catalog-count');
  if (!tbody) return;

  try {
    const products = await fetchProducts();
    catalog = products;
    if (countEl) countEl.textContent = `${products.length} total products`;

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px;">No products available. Add your first product above!</td></tr>`;
      return;
    }

    tbody.innerHTML = products
      .map(
        (p) => `
      <tr>
        <td>
          <img src="${p.imageUrl}" alt="${p.name}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);" onerror="this.src='https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=120&q=80'" />
        </td>
        <td><strong>${p.name}</strong></td>
        <td>${p.category ?? 'Store'}</td>
        <td><strong>${formatCurrency(p.price)}</strong></td>
        <td>${p.stock}</td>
        <td>
          <div class="action-btns-cell">
            <button class="edit-action-btn" data-edit-id="${p.id}" type="button">✏️ Edit</button>
            <button class="delete-action-btn" data-delete-id="${p.id}" type="button">🗑️ Delete</button>
          </div>
        </td>
      </tr>
    `,
      )
      .join('');

    tbody.querySelectorAll('.edit-action-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number((btn as HTMLElement).dataset.editId);
        const item = catalog.find((p) => p.id === id);
        if (item) {
          editingProduct = item;
          renderView();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });

    tbody.querySelectorAll('.delete-action-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = Number((btn as HTMLElement).dataset.deleteId);
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
          await deleteProduct(id);
          showToast('Product deleted.');
          if (editingProduct?.id === id) {
            editingProduct = null;
          }
          await loadAdminProductsData();
        } catch (err) {
          showToast(`Delete failed: ${err instanceof Error ? err.message : 'Error'}`);
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">${err instanceof Error ? err.message : 'Error'}</td></tr>`;
  }
}

// Admin Orders View
function renderAdminOrdersView() {
  return `
    <div class="admin-card">
      <div class="section-header" style="margin-bottom: 20px;">
        <h2 class="section-title">Customer Orders Management</h2>
        <span class="status-badge status-SHIPPED">Admin Controls</span>
      </div>

      <div class="admin-grid-3" style="margin-bottom: 24px;">
        <div class="metric-card" style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);">
          <span>Total Number of Orders</span>
          <strong id="admin-orders-total-count" style="color: var(--brand-orange);">Loading...</strong>
        </div>
        <div class="metric-card">
          <span>Total Pages</span>
          <strong id="admin-orders-total-pages">Loading...</strong>
        </div>
        <div class="metric-card">
          <span>Active Page</span>
          <strong id="admin-orders-active-page">1</strong>
        </div>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;">
        <input id="admin-search-order" class="form-input" style="max-width: 260px;" type="search" placeholder="Search customer email..." value="${adminOrdersSearch}" />
        <select id="admin-status-filter" class="form-input" style="max-width: 170px;">
          <option value="" ${!adminOrdersStatus ? 'selected' : ''}>All Statuses</option>
          <option value="PENDING" ${adminOrdersStatus === 'PENDING' ? 'selected' : ''}>PENDING</option>
          <option value="PROCESSING" ${adminOrdersStatus === 'PROCESSING' ? 'selected' : ''}>PROCESSING</option>
          <option value="SHIPPED" ${adminOrdersStatus === 'SHIPPED' ? 'selected' : ''}>SHIPPED</option>
          <option value="DELIVERED" ${adminOrdersStatus === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
          <option value="CANCELLED" ${adminOrdersStatus === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
        </select>
        <select id="admin-orders-size-select" class="form-input" style="max-width: 140px;">
          <option value="5" ${adminOrdersSize === 5 ? 'selected' : ''}>5 per page</option>
          <option value="10" ${adminOrdersSize === 10 ? 'selected' : ''}>10 per page</option>
          <option value="20" ${adminOrdersSize === 20 ? 'selected' : ''}>20 per page</option>
          <option value="50" ${adminOrdersSize === 50 ? 'selected' : ''}>50 per page</option>
        </select>
        <button id="admin-filter-apply-btn" class="add-btn" type="button">Filter</button>
        <button id="admin-filter-reset-btn" class="add-btn" style="background: #e2e8f0; color: var(--text-navy);" type="button">Reset</button>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Items</th>
              <th>Update Status</th>
            </tr>
          </thead>
          <tbody id="admin-orders-table-body">
            <tr><td colspan="5" style="text-align: center; padding: 24px;">Loading customer orders...</td></tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-container" style="margin-top: 24px;">
        <span id="admin-orders-page-summary" style="font-size: 0.88rem; font-weight: 600; color: var(--text-muted);">
          Showing orders
        </span>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="admin-prev-orders-btn" class="page-nav-btn" type="button">
            &larr; Previous
          </button>
          <span class="page-badge-pill" id="admin-page-badge">Page 1</span>
          <button id="admin-next-orders-btn" class="page-nav-btn" type="button">
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  `;
}

async function loadAdminOrdersData() {
  const tbody = document.getElementById('admin-orders-table-body');
  const totalCountEl = document.getElementById('admin-orders-total-count');
  const totalPagesEl = document.getElementById('admin-orders-total-pages');
  const activePageEl = document.getElementById('admin-orders-active-page');
  const pageBadge = document.getElementById('admin-page-badge');
  const pageSummary = document.getElementById('admin-orders-page-summary');
  const prevBtn = document.getElementById('admin-prev-orders-btn') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('admin-next-orders-btn') as HTMLButtonElement | null;

  if (!tbody) return;

  try {
    const page = await fetchAdminOrders(adminOrdersPage, adminOrdersSize, adminOrdersSearch, adminOrdersStatus);
    
    if (totalCountEl) totalCountEl.textContent = String(page.totalElements);
    if (totalPagesEl) totalPagesEl.textContent = String(page.totalPages);
    if (activePageEl) activePageEl.textContent = String(page.number + 1);
    if (pageBadge) pageBadge.textContent = `Page ${page.number + 1} of ${Math.max(1, page.totalPages)}`;
    if (pageSummary) pageSummary.textContent = `Showing page ${page.number + 1} of ${Math.max(1, page.totalPages)} (${page.totalElements} total orders)`;

    if (prevBtn) prevBtn.disabled = page.number === 0;
    if (nextBtn) nextBtn.disabled = page.number >= page.totalPages - 1;

    if (page.content.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px;">No customer orders match the filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = page.content
      .map(
        (o) => `
      <tr>
        <td><strong>#${o.orderId}</strong></td>
        <td>${o.userEmail}</td>
        <td><strong>${formatCurrency(o.total)}</strong></td>
        <td>${o.items?.length ?? 0} items</td>
        <td>
          <select class="form-input admin-status-select" data-order-id="${o.orderId}" style="padding: 6px 10px; font-weight: 700; width: auto;">
            ${['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
            .map((st) => `<option value="${st}" ${st === o.status ? 'selected' : ''}>${st}</option>`)
            .join('')}
          </select>
        </td>
      </tr>
    `,
      )
      .join('');

    tbody.querySelectorAll('.admin-status-select').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const select = e.target as HTMLSelectElement;
        const orderId = Number(select.dataset.orderId);
        const newStatus = select.value;
        select.disabled = true;
        try {
          await updateOrderStatus(orderId, newStatus);
          showToast(`Order #${orderId} updated to ${newStatus}`);
        } catch (err) {
          showToast(`Update error: ${err instanceof Error ? err.message : 'Failed'}`);
        } finally {
          select.disabled = false;
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 24px;">${err instanceof Error ? err.message : 'Error loading orders'}</td></tr>`;
  }
}

// Master Render & Event Bindings
function renderShell() {
  if (!app) return;

  app.innerHTML = `
    ${renderNavbar()}
    <main class="main-wrapper">
      <div class="storefront-grid">
        ${renderSidebar()}
        <section id="content-panel">
          <!-- Dynamically populated view -->
        </section>
      </div>
    </main>
    ${renderFooter()}
    ${renderModalsAndDrawers()}
  `;

  bindNavbarEvents();
  bindSidebarEvents();
}

function bindNavbarEvents() {
  // Brand Click -> reset to storefront
  document.getElementById('nav-brand-logo')?.addEventListener('click', () => {
    selectedCategory = 'All';
    searchQuery = '';
    currentView = 'storefront';
    renderView();
  });

  // Search input with smooth in-place filtering
  const searchInput = document.getElementById('global-search-input') as HTMLInputElement | null;
  searchInput?.addEventListener('input', (e) => {
    searchQuery = (e.target as HTMLInputElement).value;
    if (currentView !== 'storefront') {
      currentView = 'storefront';
      renderView();
      const inp = document.getElementById('global-search-input') as HTMLInputElement | null;
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    } else {
      const deals = document.getElementById('deals-section');
      if (deals) {
        deals.outerHTML = renderDealsGrid();
        bindProductButtons();
      } else {
        renderView();
      }

      // Manage clear button without destroying search input
      const parent = searchInput.parentElement;
      const clearBtn = document.getElementById('search-clear-btn');
      if (searchQuery.trim()) {
        if (!clearBtn && parent) {
          const newClearBtn = document.createElement('button');
          newClearBtn.id = 'search-clear-btn';
          newClearBtn.className = 'search-clear-btn';
          newClearBtn.textContent = '✕';
          newClearBtn.type = 'button';
          newClearBtn.addEventListener('click', () => {
            searchQuery = '';
            searchInput.value = '';
            newClearBtn.remove();
            const d = document.getElementById('deals-section');
            if (d) {
              d.outerHTML = renderDealsGrid();
              bindProductButtons();
            }
          });
          parent.appendChild(newClearBtn);
        }
      } else if (clearBtn) {
        clearBtn.remove();
      }
    }
  });

  document.getElementById('search-clear-btn')?.addEventListener('click', () => {
    searchQuery = '';
    const inp = document.getElementById('global-search-input') as HTMLInputElement | null;
    if (inp) inp.value = '';
    document.getElementById('search-clear-btn')?.remove();
    const deals = document.getElementById('deals-section');
    if (deals) {
      deals.outerHTML = renderDealsGrid();
      bindProductButtons();
    }
  });

  // Cart trigger
  document.getElementById('nav-cart-trigger')?.addEventListener('click', () => {
    toggleCartDrawer(true);
  });

  // Profile trigger
  document.getElementById('nav-profile-trigger')?.addEventListener('click', () => {
    if (isLoggedIn()) {
      currentView = 'orders';
      renderView();
    } else {
      authMode = 'login';
      authMessage = '';
      renderAuthModalContent();
      toggleAuthModal(true);
    }
  });

  // Drawer checkout btn
  document.getElementById('drawer-checkout-btn')?.addEventListener('click', () => {
    void handleDrawerCheckout();
  });

  // Footer links
  document.getElementById('footer-orders-link')?.addEventListener('click', () => {
    currentView = 'orders';
    renderView();
  });

  document.getElementById('footer-cart-link')?.addEventListener('click', () => {
    toggleCartDrawer(true);
  });
}

function bindSidebarEvents() {
  document.querySelectorAll('[data-category]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const cat = (e.currentTarget as HTMLElement).dataset.category;
      if (cat) filterByCategory(cat);
    });
  });

  document.querySelectorAll('[data-view]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const view = (e.currentTarget as HTMLElement).dataset.view as typeof currentView;
      if (view) {
        currentView = view;
        renderView();
      }
    });
  });

  document.getElementById('sidebar-logout-btn')?.addEventListener('click', () => {
    clearUserSession();
    showToast('Logged out successfully.');
    currentView = 'storefront';
    renderView();
  });
}

function bindCarouselEvents() {
  const prev = document.getElementById('carousel-prev');
  const next = document.getElementById('carousel-next');
  const container = document.getElementById('banner-carousel');

  prev?.addEventListener('click', () => goToSlide(activeSlideIndex - 1));
  next?.addEventListener('click', () => goToSlide(activeSlideIndex + 1));

  document.querySelectorAll('.carousel-dot').forEach((dot) => {
    dot.addEventListener('click', (e) => {
      const idx = Number((e.currentTarget as HTMLElement).dataset.slideIndex);
      goToSlide(idx);
    });
  });

  // Slide clicks
  document.querySelectorAll('[data-target-category]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const cat = (e.currentTarget as HTMLElement).dataset.targetCategory;
      if (cat) filterByCategory(cat);
    });
  });

  // Auto-scroll pause on hover
  container?.addEventListener('mouseenter', stopCarouselTimer);
  container?.addEventListener('mouseleave', startCarouselTimer);

  startCarouselTimer();
}

function bindProductButtons() {
  document.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = Number((e.currentTarget as HTMLElement).dataset.productId);
      if (id) addToCart(id);
    });
  });
}

function renderView() {
  renderShell();

  const content = document.getElementById('content-panel');
  if (!content) return;

  stopOrdersAutoRefresh();

  if (currentView === 'storefront') {
    content.innerHTML = `
      ${renderCarousel()}
      ${renderCategoryShortcuts()}
      ${renderDealsGrid()}
      ${renderSloganStrip()}
    `;
    bindCarouselEvents();
    bindProductButtons();
    return;
  }

  if (currentView === 'orders') {
    content.innerHTML = renderOrdersView();
    void loadOrdersData();

    document.getElementById('prev-orders-btn')?.addEventListener('click', () => {
      if (currentPage > 0) {
        currentPage -= 1;
        void loadOrdersData();
      }
    });

    document.getElementById('next-orders-btn')?.addEventListener('click', () => {
      currentPage += 1;
      void loadOrdersData();
    });

    startOrdersAutoRefresh();
    return;
  }

  if (currentView === 'dashboard') {
    if (!isAdmin()) {
      currentView = 'storefront';
      renderView();
      return;
    }
    content.innerHTML = renderDashboardView();
    void loadDashboardData();
    return;
  }

  if (currentView === 'admin-products') {
    if (!isAdmin()) {
      currentView = 'storefront';
      renderView();
      return;
    }
    content.innerHTML = renderAdminProductsView();
    void loadAdminProductsData();

    // Image Upload & Preview bindings
    const fileInput = document.getElementById('product-file-input') as HTMLInputElement | null;
    const urlInput = document.getElementById('product-image-url-input') as HTMLInputElement | null;
    const previewWrapper = document.getElementById('image-preview-wrapper');
    const previewImg = document.getElementById('image-preview-img') as HTMLImageElement | null;
    const previewCaption = document.getElementById('image-preview-caption');

    fileInput?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          // Scale down image to max 800x800 for optimal storage & fast loading
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            if (urlInput) urlInput.value = optimizedDataUrl;
            if (previewImg) previewImg.src = optimizedDataUrl;
            if (previewWrapper) previewWrapper.style.display = 'flex';
            if (previewCaption) previewCaption.textContent = `Ready: ${file.name}`;
            showToast(`Image "${file.name}" uploaded successfully!`);
            return;
          }
          if (urlInput) urlInput.value = rawResult;
          if (previewImg) previewImg.src = rawResult;
          if (previewWrapper) previewWrapper.style.display = 'flex';
          if (previewCaption) previewCaption.textContent = `Uploaded: ${file.name}`;
          showToast(`Image "${file.name}" loaded`);
        };
        img.onerror = () => {
          if (urlInput) urlInput.value = rawResult;
          if (previewImg) previewImg.src = rawResult;
          if (previewWrapper) previewWrapper.style.display = 'flex';
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
    });

    urlInput?.addEventListener('input', () => {
      const val = urlInput.value.trim();
      if (val && previewImg && previewWrapper) {
        previewImg.src = val;
        previewWrapper.style.display = 'flex';
        if (previewCaption) previewCaption.textContent = 'Custom URL Preview';
      } else if (previewWrapper) {
        previewWrapper.style.display = 'none';
      }
    });

    // Cancel edit button
    document.getElementById('cancel-edit-product-btn')?.addEventListener('click', () => {
      editingProduct = null;
      renderView();
    });

    // Form submission
    const form = document.getElementById('admin-product-form') as HTMLFormElement | null;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        if (editingProduct) {
          await updateProduct(editingProduct.id, form);
          showToast('Product updated successfully!');
          editingProduct = null;
        } else {
          await createProduct(form);
          showToast('Product created successfully!');
        }
        renderView();
      } catch (err) {
        showToast(`Failed: ${err instanceof Error ? err.message : 'Error'}`);
      }
    });
    return;
  }

  if (currentView === 'admin-orders') {
    if (!isAdmin()) {
      currentView = 'storefront';
      renderView();
      return;
    }
    content.innerHTML = renderAdminOrdersView();
    void loadAdminOrdersData();

    // Filter Apply
    document.getElementById('admin-filter-apply-btn')?.addEventListener('click', () => {
      adminOrdersSearch = (document.getElementById('admin-search-order') as HTMLInputElement).value;
      adminOrdersStatus = (document.getElementById('admin-status-filter') as HTMLSelectElement).value;
      adminOrdersSize = Number((document.getElementById('admin-orders-size-select') as HTMLSelectElement).value) || 10;
      adminOrdersPage = 0;
      void loadAdminOrdersData();
    });

    // Filter Reset
    document.getElementById('admin-filter-reset-btn')?.addEventListener('click', () => {
      adminOrdersSearch = '';
      adminOrdersStatus = '';
      adminOrdersPage = 0;
      const searchInput = document.getElementById('admin-search-order') as HTMLInputElement | null;
      const statusSelect = document.getElementById('admin-status-filter') as HTMLSelectElement | null;
      if (searchInput) searchInput.value = '';
      if (statusSelect) statusSelect.value = '';
      void loadAdminOrdersData();
    });

    // Page Size Change
    document.getElementById('admin-orders-size-select')?.addEventListener('change', (e) => {
      adminOrdersSize = Number((e.target as HTMLSelectElement).value) || 10;
      adminOrdersPage = 0;
      void loadAdminOrdersData();
    });

    // Prev Button
    document.getElementById('admin-prev-orders-btn')?.addEventListener('click', () => {
      if (adminOrdersPage > 0) {
        adminOrdersPage -= 1;
        void loadAdminOrdersData();
      }
    });

    // Next Button
    document.getElementById('admin-next-orders-btn')?.addEventListener('click', () => {
      adminOrdersPage += 1;
      void loadAdminOrdersData();
    });
    return;
  }
}

function startOrdersAutoRefresh() {
  ordersRefreshTimer = window.setInterval(() => {
    if (currentView === 'orders' && document.visibilityState === 'visible') {
      void loadOrdersData();
    }
  }, 10000);
}

function stopOrdersAutoRefresh() {
  if (ordersRefreshTimer !== undefined) {
    window.clearInterval(ordersRefreshTimer);
    ordersRefreshTimer = undefined;
  }
}

// Initialization
async function initializeApp() {
  await restoreSession();
  try {
    const products = await fetchProducts();
    if (products && products.length > 0) {
      catalog = products;
    }
  } catch {
    // Keep initialCatalog
  }
  renderView();
}

void initializeApp();
