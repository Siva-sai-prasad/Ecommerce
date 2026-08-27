package com.ecommerce.service;

import com.ecommerce.dto.CreateOrderRequest;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.model.Order;
import com.ecommerce.model.Product;
import com.ecommerce.model.User;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.sql.Timestamp;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OrderServiceTest {

    @Test
    void createOrder_createsOrderAndReducesStock() {
        UserRepository userRepository = mock(UserRepository.class);
        ProductRepository productRepository = mock(ProductRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);

        User user = new User();
        user.setId(1L);
        user.setEmail("jane@example.com");
        user.setRole("USER");
        user.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        Product product = new Product();
        product.setId(3L);
        product.setName("Smartphone");
        product.setDescription("Android smartphone");
        product.setPrice(899.99);
        product.setStock(5);

        Order savedOrder = new Order();
        savedOrder.setId(100L);
        savedOrder.setUser(user);
        savedOrder.setStatus("PENDING");
        savedOrder.setTotal(product.getPrice() * 2);
        savedOrder.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(productRepository.findById(3L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        OrderService orderService = new OrderService(userRepository, productRepository, orderRepository);
        CreateOrderRequest request = new CreateOrderRequest();
        request.setProductId(3L);
        request.setQuantity(2);

        OrderResponse response = orderService.createOrder("jane@example.com", request);

        assertNotNull(response);
        assertEquals("jane@example.com", response.getUserEmail());
        assertEquals(2, response.getQuantity());
        assertEquals("PENDING", response.getStatus());
        assertEquals(3, product.getStock());
    }
}
