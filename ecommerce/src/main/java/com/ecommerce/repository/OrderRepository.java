package com.ecommerce.repository;

import com.ecommerce.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
	List<Order> findByUser_Email(String email);

	Page<Order> findByUser_Email(String email, Pageable pageable);

	@Query("""
			select o from Order o
			where (:search is null or lower(o.user.email) like lower(concat('%', :search, '%')))
			and (:status is null or o.status = :status)
			""")
	Page<Order> findAllForAdmin(@Param("search") String search,
	                           @Param("status") String status,
	                           Pageable pageable);
}
