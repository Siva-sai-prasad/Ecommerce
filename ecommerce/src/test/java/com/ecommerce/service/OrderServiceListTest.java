package com.ecommerce.service;

import com.ecommerce.dto.OrderItemResponse;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.model.Order;
import com.ecommerce.model.OrderItem;
import com.ecommerce.model.Product;
import com.ecommerce.model.User;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OrderServiceListTest {

    @Test
    void getOrdersForUser_returnsMappedOrders() {
        UserRepository userRepository = mock(UserRepository.class);
        ProductRepository productRepository = mock(ProductRepository.class);
        OrderRepository orderRepository = mock(OrderRepository.class);

        User user = new User();
        user.setId(1L);
        user.setEmail("jane@example.com");

        Product product = new Product();
        product.setId(3L);
        product.setName("Smartphone");

        OrderItem item = new OrderItem();
        item.setId(10L);
        item.setProduct(product);
        item.setQuantity(2);
        item.setPrice(100.0);

        Order order = new Order();
        order.setId(50L);
        order.setUser(user);
        order.setStatus("PENDING");
        order.setTotal(200.0);
        order.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        List<OrderItem> items = new ArrayList<>();
        items.add(item);
        order.setItems(items);

        List<Order> orders = new ArrayList<>();
        orders.add(order);

        when(orderRepository.findByUser_Email("jane@example.com")).thenReturn(orders);

        OrderService service = new OrderService(userRepository, productRepository, orderRepository);
        List<OrderResponse> responses = service.getOrdersForUser("jane@example.com");

        assertEquals(1, responses.size());
        OrderResponse r = responses.get(0);
        assertEquals(50L, r.getOrderId());
        assertEquals("jane@example.com", r.getUserEmail());
        assertEquals(1, r.getItems().size());
        OrderItemResponse ir = r.getItems().get(0);
        assertEquals(3L, ir.getProductId());
        assertEquals(2, ir.getQuantity());
    }
}
