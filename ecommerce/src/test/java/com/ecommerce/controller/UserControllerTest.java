package com.ecommerce.controller;

import com.ecommerce.dto.UserResponse;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserControllerTest {

    @Test
    void getCurrentUser_returnsAuthenticatedUserProfile() {
        UserRepository userRepository = mock(UserRepository.class);
        UserController controller = new UserController(userRepository);

        User user = new User();
        user.setId(7L);
        user.setName("Jane");
        user.setEmail("jane@example.com");
        user.setRole("USER");
        user.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "jane@example.com",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                )
        );

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        UserResponse response = controller.getCurrentUser();

        assertEquals("jane@example.com", response.getEmail());
        assertEquals("Jane", response.getName());
        assertEquals("USER", response.getRole());
    }
}
