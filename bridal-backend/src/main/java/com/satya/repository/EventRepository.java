package com.satya.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.satya.model.BridalEvent;

public interface EventRepository extends JpaRepository<BridalEvent, Long> {
	  List<BridalEvent> findByUserId(Long userId);
	}