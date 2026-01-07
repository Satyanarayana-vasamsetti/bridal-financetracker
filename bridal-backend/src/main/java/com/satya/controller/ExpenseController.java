package com.satya.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.satya.model.Expense;
import com.satya.model.User;
import com.satya.repository.ExpenseRepository;
import com.satya.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseRepository repo;
    private final UserRepository userRepo;

    /* ================= GET EXPENSES ================= */
    @GetMapping
    public List<Expense> getExpenses(Authentication authentication) {

        String email = authentication.getName(); // ✅ from JWT
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return repo.findByUserId(user.getId());
    }

    /* ================= ADD EXPENSE ================= */
    @PostMapping
    public Expense addExpense(
            @RequestBody Expense expense,
            Authentication authentication) {

        String email = authentication.getName();
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        expense.setUser(user);
        return repo.save(expense);
    }

    /* ================= UPDATE EXPENSE ================= */
    @PutMapping("/{id}")
    public Expense updateExpense(
            @PathVariable Long id,
            @RequestBody Expense expense,
            Authentication authentication) {

        String email = authentication.getName();
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        expense.setId(id);
        expense.setUser(user);
        return repo.save(expense);
    }

    /* ================= DELETE EXPENSE ================= */
    @DeleteMapping("/{id}")
    public void deleteExpense(@PathVariable Long id) {
        repo.deleteById(id);
    }
}
