package com.ecommerce.controller;

import com.ecommerce.dto.CreateOrderRequest;
import com.ecommerce.dto.CartItemRequest;
import com.ecommerce.dto.CartResponse;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.dto.ProductResponse;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ProductOrderControllerTest {

    private static class StubProductService extends ProductService {
        StubProductService() {
            super(null);
        }

        @Override
        public List<ProductResponse> getAllProducts() {
            return List.of(
                    new ProductResponse(1L, "Laptop", "Gaming laptop", 1200.00, 10),
                    new ProductResponse(2L, "Headphones", "Noise cancelling headset", 250.00, 15),
                    new ProductResponse(3L, "Smartphone", "Android smartphone", 899.99, 20)
            );
        }

        @Override
        public ProductResponse getProductById(Long id) {
            return new ProductResponse(2L, "Headphones", "Noise cancelling headset", 250.00, 15);
        }
    }

    @Test
    void getProducts_returnsListOfProducts() {
        ProductController controller = new ProductController(new StubProductService());

        List<ProductResponse> products = controller.getProducts();

        assertEquals(3, products.size());
        assertEquals("Laptop", products.get(0).getName());
    }

    @Test
    void getProductById_returnsSelectedProduct() {
        ProductController controller = new ProductController(new StubProductService());

        ProductResponse product = controller.getProductById(2L);

        assertEquals("Headphones", product.getName());
        assertEquals(250.00, product.getPrice());
    }

    @Test
    void createOrder_returnsOrderSummary() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "jane@example.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );

        OrderService orderService = new OrderService(null, null, null) {
            @Override
            public OrderResponse createOrder(String email, CreateOrderRequest request) {
                return new OrderResponse(1001L, request.getProductId(), email, request.getQuantity(), "PENDING");
            }
        };

        OrderController controller = new OrderController(orderService);
        CreateOrderRequest request = new CreateOrderRequest();
        request.setProductId(1L);
        request.setQuantity(2);

        OrderResponse response = controller.createOrder(request);

        assertNotNull(response);
        assertEquals("jane@example.com", response.getUserEmail());
        assertEquals(2, response.getQuantity());
        assertEquals("PENDING", response.getStatus());
    }

    @Test
    void cartController_managesCartItems() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "jane@example.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );

        CartController controller = new CartController();

        CartItemRequest request = new CartItemRequest();
        request.setProductId(3L);
        request.setQuantity(1);

        controller.addItem(request);
        CartResponse cart = controller.getCart();

        assertEquals(1, cart.getItems().size());
        assertEquals("Smartphone", cart.getItems().get(0).getName());
        assertEquals(899.99, cart.getTotal(), 0.01);
    }
}
