package com.makersacademy.acebook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

@SpringBootApplication
public class Application {

    public static void main(String[] args) throws Throwable { SpringApplication.run(Application.class, args);
    }
}
