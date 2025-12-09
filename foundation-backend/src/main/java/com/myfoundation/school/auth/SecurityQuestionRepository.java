package com.myfoundation.school.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SecurityQuestionRepository extends JpaRepository<SecurityQuestion, String> {
    List<SecurityQuestion> findByActiveOrderByDisplayOrder(boolean active);
    boolean existsByQuestion(String question);
}
