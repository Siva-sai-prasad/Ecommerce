package com.ecommerce.dto;

import java.util.ArrayList;
import java.util.List;

public class OrderResponse {
    private Long orderId;
    private String userEmail;
    private String status;
    private double total;
    private List<OrderItemResponse> items = new ArrayList<>();

    public OrderResponse() {}

    // Backwards-compatible constructor used previously
    public OrderResponse(Long orderId, Long productId, String userEmail, int quantity, String status) {
        this.orderId = orderId;
        this.userEmail = userEmail;
        this.status = status;
        // create a single item entry for compatibility
        OrderItemResponse i = new OrderItemResponse(productId, null, quantity, 0.0);
        this.items.add(i);
    }

    public OrderResponse(Long orderId, String userEmail, String status, double total, List<OrderItemResponse> items) {
        this.orderId = orderId;
        this.userEmail = userEmail;
        this.status = status;
        this.total = total;
        if (items != null) this.items = items;
    }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }

    public List<OrderItemResponse> getItems() { return items; }
    public void setItems(List<OrderItemResponse> items) { this.items = items; }

    // Backwards-compatible quantity accessor (sum of item quantities)
    public int getQuantity() {
        return items == null ? 0 : items.stream().mapToInt(OrderItemResponse::getQuantity).sum();
    }

    public void setQuantity(int quantity) {
        // no-op for compatibility; items should be used to represent quantities
    }
}
