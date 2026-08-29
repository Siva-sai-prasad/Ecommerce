package com.ecommerce.controller;

import com.ecommerce.model.Order;
import com.ecommerce.model.OrderItem;
import com.ecommerce.model.Product;
import com.ecommerce.model.User;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.transaction.Transactional;
import java.util.List;
import java.sql.Timestamp;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    @Transactional
    void listOrders_returnsPagedOrders() throws Exception {
        User user = new User();
        user.setEmail("jane@example.com");
        user.setName("Jane");
        user.setPassword("secret");
        user.setRole("USER");
        user.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        userRepository.save(user);

        Product p = new Product();
        p.setName("Phone");
        p.setPrice(199.99);
        p.setStock(10);
        productRepository.save(p);

        Order order = new Order();
        order.setUser(user);
        order.setStatus("PENDING");
        order.setTotal(199.99);
        order.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        OrderItem oi = new OrderItem();
        oi.setOrder(order);
        oi.setProduct(p);
        oi.setQuantity(1);
        oi.setPrice(199.99);
        order.getItems().add(oi);

        orderRepository.save(order);

        mockMvc.perform(get("/api/orders").param("page", "0").param("size", "10")
            .with(user("jane@example.com").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content[0].userEmail").value("jane@example.com"))
                .andExpect(jsonPath("$.content[0].items[0].productName").value("Phone"));
    }
}
