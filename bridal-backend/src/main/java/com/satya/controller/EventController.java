package com.satya.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.satya.model.BridalEvent;
import com.satya.model.User;
import com.satya.repository.EventRepository;
import com.satya.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository repo;
    private final UserRepository userRepo;

    /* ================= GET EVENTS ================= */
    @GetMapping
    public List<BridalEvent> getEvents(Authentication authentication) {

        String email = authentication.getName(); // ✅ from JWT
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return repo.findByUserId(user.getId());
    }

    /* ================= ADD EVENT ================= */
    @PostMapping
    public BridalEvent addEvent(
            @RequestBody BridalEvent event,
            Authentication authentication) {

        String email = authentication.getName();
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        event.setUser(user);
        return repo.save(event);
    }

    /* ================= UPDATE EVENT ================= */
    @PutMapping("/{id}")
    public BridalEvent updateEvent(
            @PathVariable Long id,
            @RequestBody BridalEvent event,
            Authentication authentication) {

        String email = authentication.getName();
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        event.setId(id);
        event.setUser(user);
        return repo.save(event);
    }

    /* ================= DELETE EVENT ================= */
    @DeleteMapping("/{id}")
    public void deleteEvent(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
