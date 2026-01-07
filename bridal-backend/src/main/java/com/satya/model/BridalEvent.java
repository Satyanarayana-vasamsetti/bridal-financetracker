package com.satya.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "bridal_event")
@Data
public class BridalEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String date;
    private String eventName;
    private String clientName;
    private String serviceType;
    private Double amount;
    private String notes;

    @ManyToOne
    @JoinColumn(name = "user_id") 
    private User user;
}
