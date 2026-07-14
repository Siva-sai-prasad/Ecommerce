package com.ecommerce.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.dto.SignupRequest;
import com.ecommerce.dto.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/signup")
    public UserResponse signup(@Valid @RequestBody SignupRequest req) {
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole("USER");
        user.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));

        User saved = userRepository.save(user);

        return new UserResponse(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), saved.getCreatedAt());
    }
}
