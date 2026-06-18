package com.myfoundation.school;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FoundationApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(FoundationApplication.class, args);
    }
}
