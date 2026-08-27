package com.ecommerce.dto;

import java.util.ArrayList;
import java.util.List;

public class CartResponse {
    private List<CartItemResponse> items = new ArrayList<>();
    private double total;

    public List<CartItemResponse> getItems() { return items; }
    public void setItems(List<CartItemResponse> items) { this.items = items; }

    public double getTotal() { return total; }
    public void setTotal(double total) { this.total = total; }
}
