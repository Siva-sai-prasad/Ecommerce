package com.ecommerce.service;

import com.ecommerce.dto.ProductRequest;
import com.ecommerce.dto.ProductResponse;
import com.ecommerce.model.Product;
import com.ecommerce.repository.ProductRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProductServiceTest {

    @Test
    void getAllProducts_returnsMappedProducts() {
        ProductRepository repository = mock(ProductRepository.class);
        Product product = new Product();
        product.setId(1L);
        product.setName("Laptop");
        product.setDescription("Gaming laptop");
        product.setPrice(1200.0);
        product.setStock(10);

        when(repository.findAll()).thenReturn(List.of(product));

        ProductService service = new ProductService(repository);
        List<ProductResponse> result = service.getAllProducts();

        assertEquals(1, result.size());
        assertEquals("Laptop", result.get(0).getName());
    }

    @Test
    void createProduct_savesAndReturnsResponse() {
        ProductRepository repository = mock(ProductRepository.class);
        Product product = new Product();
        product.setId(10L);
        product.setName("Mouse");
        product.setDescription("Wireless mouse");
        product.setPrice(45.0);
        product.setStock(25);

        when(repository.save(org.mockito.ArgumentMatchers.any(Product.class))).thenReturn(product);

        ProductService service = new ProductService(repository);
        ProductRequest request = new ProductRequest();
        request.setName("Mouse");
        request.setDescription("Wireless mouse");
        request.setPrice(45.0);
        request.setStock(25);

        ProductResponse response = service.createProduct(request);

        assertNotNull(response);
        assertEquals("Mouse", response.getName());
        assertEquals(25, response.getStock());
    }

    @Test
    void getProductById_returnsMappedProduct() {
        ProductRepository repository = mock(ProductRepository.class);
        Product product = new Product();
        product.setId(2L);
        product.setName("Headphones");
        product.setDescription("Noise cancelling headset");
        product.setPrice(250.0);
        product.setStock(12);

        when(repository.findById(2L)).thenReturn(Optional.of(product));

        ProductService service = new ProductService(repository);
        ProductResponse response = service.getProductById(2L);

        assertEquals("Headphones", response.getName());
        assertEquals(12, response.getStock());
    }
}
