package com.ecommerce.controller;

import com.ecommerce.dto.CreateOrderRequest;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.dto.UpdateOrderStatusRequest;
import com.ecommerce.service.OrderService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/orders")
    public OrderResponse createOrder(@RequestBody CreateOrderRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication != null ? authentication.getName() : "guest@example.com";

        return orderService.createOrder(userEmail, request);
    }

    @org.springframework.web.bind.annotation.GetMapping("/orders")
    public org.springframework.data.domain.Page<OrderResponse> listOrders(
            org.springframework.data.domain.Pageable pageable) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication != null ? authentication.getName() : "guest@example.com";
        return orderService.getOrdersForUser(userEmail, pageable);
    }

    @org.springframework.web.bind.annotation.GetMapping("/admin/orders")
    public org.springframework.data.domain.Page<OrderResponse> listAllOrders(
            org.springframework.data.domain.Pageable pageable) {
        return orderService.getAllOrders(pageable);
    }

    @org.springframework.web.bind.annotation.PatchMapping("/admin/orders/{orderId}/status")
    public OrderResponse updateOrderStatus(
            @org.springframework.web.bind.annotation.PathVariable Long orderId,
            @RequestBody UpdateOrderStatusRequest request) {
        return orderService.updateOrderStatus(orderId, request.getStatus());
    }
}
