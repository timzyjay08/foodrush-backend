package com.foodrush.repository;

import com.foodrush.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserIdOrderByIdAsc(Long userId);
    List<Address> findByUserId(Long userId);
}
