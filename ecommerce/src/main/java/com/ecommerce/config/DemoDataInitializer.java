package com.ecommerce.config;

import com.ecommerce.model.Product;
import com.ecommerce.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DemoDataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;

    public DemoDataInitializer(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {
        if (productRepository.count() > 0) {
            return;
        }

        productRepository.saveAll(List.of(
                createProduct("Laptop", "Lightweight business laptop for daily productivity.", 999.0, 25,
                        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80"),
                createProduct("Headphones", "Noise-cancelling headphones with a warm bass profile.", 89.99, 40,
                        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80"),
                createProduct("Phone", "Premium smartphone with crisp camera performance.", 599.0, 30,
                        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"),
                createProduct("Smart Watch", "Fitness-focused smartwatch with health tracking.", 179.0, 35,
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80")
        ));
    }

    private Product createProduct(String name, String description, double price, int stock, String imageUrl) {
        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setStock(stock);
        product.setImageUrl(imageUrl);
        return product;
    }
}