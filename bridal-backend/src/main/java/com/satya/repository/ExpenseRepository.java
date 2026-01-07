package com.satya.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.satya.model.Expense;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
	  List<Expense> findByUserId(Long userId);
	}
