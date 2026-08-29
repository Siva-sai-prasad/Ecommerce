# Ecommerce API (local)

This small README documents the recently added orders listing endpoint.

## GET /api/orders

Returns a paginated list of orders for the authenticated user.

Query parameters:
- `page` (optional, default `0`) — zero-based page index
- `size` (optional, default `10`) — page size

Response: JSON `Page<OrderResponse>` with fields such as `content`, `totalElements`, `totalPages`.

Example request:

```
GET /api/orders?page=0&size=10
Authorization: Bearer <token>
```

Each `OrderResponse` includes `orderId`, `userEmail`, `status`, `total`, and `items` (list of order items).
