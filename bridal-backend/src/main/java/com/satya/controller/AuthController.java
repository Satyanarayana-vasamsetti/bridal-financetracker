package com.satya.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.satya.dto.AuthRequest;
import com.satya.model.User;
import com.satya.repository.UserRepository;
import com.satya.util.JwtUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final UserRepository userRepo;
  private final PasswordEncoder encoder;
  private final JwtUtil jwt;

  @PostMapping("/signup")
  public ResponseEntity<?> signup(@RequestBody AuthRequest req) {
    User u = new User();
    u.setEmail(req.getEmail());
    u.setPassword(encoder.encode(req.getPassword()));
    userRepo.save(u);
    return ResponseEntity.ok("User registered");
  }

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody AuthRequest req) {
    User u = userRepo.findByEmail(req.getEmail())
        .orElseThrow();
    if (!encoder.matches(req.getPassword(), u.getPassword()))
      throw new RuntimeException("Invalid");

    return ResponseEntity.ok(
      Map.of("token", jwt.generateToken(u.getEmail()))
    );
  }
}
