package com.ecommerce.service;

import com.ecommerce.dto.CreateOrderRequest;
import com.ecommerce.dto.AdminDashboardResponse;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.dto.OrderItemResponse;
import java.util.List;
import com.ecommerce.model.Order;
import com.ecommerce.model.OrderItem;
import com.ecommerce.model.Product;
import com.ecommerce.model.User;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;

@Service
public class OrderService {

    private static final java.util.Set<String> ORDER_STATUSES = java.util.Set.of(
            "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"
    );

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public OrderService(UserRepository userRepository,
                        ProductRepository productRepository,
                        OrderRepository orderRepository) {
        this(userRepository, productRepository, orderRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public OrderService(UserRepository userRepository,
                        ProductRepository productRepository,
                        OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Transactional
    public OrderResponse createOrder(String email, CreateOrderRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        if (product.getStock() < request.getQuantity()) {
            throw new IllegalArgumentException("Not enough stock available");
        }

        product.setStock(product.getStock() - request.getQuantity());
        productRepository.save(product);

        Order order = new Order();
        order.setUser(user);
        order.setStatus("PENDING");
        order.setTotal(product.getPrice() * request.getQuantity());
        order.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        // create OrderItem and attach to Order so cascade persists it
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProduct(product);
        item.setQuantity(request.getQuantity());
        item.setPrice(product.getPrice());
        order.getItems().add(item);

        Order savedOrder = orderRepository.save(order);

        // If repository exists, keep it for backward-compatibility (no-op/update)
        if (orderItemRepository != null) {
            // The item should already be persisted via cascade; ensure consistency by saving if needed
            if (item.getId() == null) {
                orderItemRepository.save(item);
            }
        }

        // build item responses from saved order
        List<OrderItemResponse> itemResponses = new java.util.ArrayList<>();
        if (savedOrder.getItems() != null && !savedOrder.getItems().isEmpty()) {
            for (OrderItem oi : savedOrder.getItems()) {
                Product p = oi.getProduct();
                OrderItemResponse ir = new OrderItemResponse(
                        p != null ? p.getId() : null,
                        p != null ? p.getName() : null,
                        oi.getQuantity(),
                        oi.getPrice()
                );
                itemResponses.add(ir);
            }
        } else {
            // fallback for tests/mocks where savedOrder doesn't contain items
            OrderItemResponse ir = new OrderItemResponse(
                    product.getId(),
                    product.getName(),
                    request.getQuantity(),
                    product.getPrice()
            );
            itemResponses.add(ir);
        }
        

        return new OrderResponse(
            savedOrder.getId(),
            user.getEmail(),
            savedOrder.getStatus(),
            savedOrder.getTotal(),
            itemResponses
        );
    }

    public java.util.List<OrderResponse> getOrdersForUser(String email) {
        java.util.List<Order> orders = orderRepository.findByUser_Email(email);
        java.util.List<OrderResponse> responses = new java.util.ArrayList<>();
        for (Order o : orders) {
            java.util.List<com.ecommerce.dto.OrderItemResponse> items = new java.util.ArrayList<>();
            if (o.getItems() != null) {
                for (OrderItem oi : o.getItems()) {
                    Product p = oi.getProduct();
                    items.add(new com.ecommerce.dto.OrderItemResponse(
                            p != null ? p.getId() : null,
                            p != null ? p.getName() : null,
                            oi.getQuantity(),
                            oi.getPrice()
                    ));
                }
            }
            responses.add(new OrderResponse(o.getId(), o.getUser().getEmail(), o.getStatus(), o.getTotal(), items));
        }
        return responses;
    }

    public org.springframework.data.domain.Page<OrderResponse> getOrdersForUser(String email, int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return getOrdersForUser(email, pageable);
    }

    public org.springframework.data.domain.Page<OrderResponse> getOrdersForUser(String email, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Order> orders = orderRepository.findByUser_Email(email, pageable);
        return orders.map(this::mapToResponse);
    }

    public org.springframework.data.domain.Page<OrderResponse> getAllOrders(org.springframework.data.domain.Pageable pageable) {
        return getAllOrders(pageable, null, null);
    }

    public org.springframework.data.domain.Page<OrderResponse> getAllOrders(
            org.springframework.data.domain.Pageable pageable, String search, String status) {
        String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
        String normalizedStatus = status == null || status.isBlank() ? null : status.trim().toUpperCase();
        if (normalizedStatus != null && !ORDER_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Unsupported order status");
        }
        return orderRepository.findAllForAdmin(normalizedSearch, normalizedStatus, pageable)
                .map(this::mapToResponse);
    }

    public AdminDashboardResponse getAdminDashboard() {
        return new AdminDashboardResponse(
                orderRepository.count(),
                orderRepository.countByStatus("PENDING"),
                userRepository.count(),
                orderRepository.sumOrderTotals()
        );
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String status) {
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase();
        if (!ORDER_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Unsupported order status");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        order.setStatus(normalizedStatus);
        return mapToResponse(orderRepository.save(order));
    }

    private OrderResponse mapToResponse(Order order) {
        java.util.List<com.ecommerce.dto.OrderItemResponse> items = new java.util.ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                items.add(new com.ecommerce.dto.OrderItemResponse(
                        product != null ? product.getId() : null,
                        product != null ? product.getName() : null,
                        item.getQuantity(),
                        item.getPrice()
                ));
            }
        }
        return new OrderResponse(order.getId(), order.getUser().getEmail(), order.getStatus(), order.getTotal(), items);
    }
}
