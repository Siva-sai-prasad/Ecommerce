package com.ecommerce.dto;

public class OrderResponse {
    private Long orderId;
    private Long productId;
    private String userEmail;
    private int quantity;
    private String status;

    public OrderResponse() {}

    public OrderResponse(Long orderId, Long productId, String userEmail, int quantity, String status) {
        this.orderId = orderId;
        this.productId = productId;
        this.userEmail = userEmail;
        this.quantity = quantity;
        this.status = status;
    }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
