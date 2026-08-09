package com.mistakebook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 错题本系统启动类
 */
@SpringBootApplication
@EnableScheduling
public class MistakeBookApplication {

    public static void main(String[] args) {
        SpringApplication.run(MistakeBookApplication.class, args);
    }
}
