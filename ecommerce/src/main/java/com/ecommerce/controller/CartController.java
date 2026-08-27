package com.ecommerce.controller;

import com.ecommerce.dto.CartItemRequest;
import com.ecommerce.dto.CartItemResponse;
import com.ecommerce.dto.CartResponse;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
public class CartController {

    private final List<CartItemResponse> cartItems = new ArrayList<>();

    @PostMapping("/cart")
    public CartItemResponse addItem(@RequestBody CartItemRequest request) {
        CartItemResponse item = new CartItemResponse(
                request.getProductId(),
                resolveProductName(request.getProductId()),
                request.getQuantity(),
                resolveProductPrice(request.getProductId())
        );

        cartItems.add(item);
        return item;
    }

    @GetMapping("/cart")
    public CartResponse getCart() {
        double total = cartItems.stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();

        CartResponse cartResponse = new CartResponse();
        cartResponse.setItems(cartItems);
        cartResponse.setTotal(total);
        return cartResponse;
    }

    private String resolveProductName(Long productId) {
        if (productId == 1L) return "Laptop";
        if (productId == 2L) return "Headphones";
        if (productId == 3L) return "Smartphone";
        return "Unknown Product";
    }

    private double resolveProductPrice(Long productId) {
        if (productId == 1L) return 1200.00;
        if (productId == 2L) return 250.00;
        if (productId == 3L) return 899.99;
        return 0.0;
    }
}
