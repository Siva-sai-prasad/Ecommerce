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
import org.springframework.test.web.servlet.MockMvc;

import jakarta.transaction.Transactional;
import java.sql.Timestamp;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerPaginationSortingTest {

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
    void listOrders_returnsPaginationAndSortedByCreatedAtDesc() throws Exception {
        User user = new User();
        user.setEmail("jane@example.com");
        user.setName("Jane");
        user.setPassword("secret");
        user.setRole("USER");
        user.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        userRepository.save(user);

        long base = System.currentTimeMillis();
        int total = 5;
        for (int i = 1; i <= total; i++) {
            Product p = new Product();
            p.setName("Item" + i);
            p.setPrice(10.0 * i);
            p.setStock(10);
            productRepository.save(p);

            Order order = new Order();
            order.setUser(user);
            order.setStatus("PENDING");
            order.setTotal(p.getPrice());
            order.setCreatedAt(new Timestamp(base + i * 1000L));

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(p);
            oi.setQuantity(1);
            oi.setPrice(p.getPrice());
            order.getItems().add(oi);

            orderRepository.save(order);
        }

        mockMvc.perform(get("/api/orders")
                .param("page", "0")
                .param("size", "2")
                .param("sort", "createdAt,desc")
                .with(user("jane@example.com").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(total))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.content[0].items[0].productName").value("Item5"));
    }
}
