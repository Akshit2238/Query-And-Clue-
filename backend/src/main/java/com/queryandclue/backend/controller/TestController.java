package com.queryandclue.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/")
    public String root() {
        return "Query & Clue API is running!";
    }

    @GetMapping("/api/test")
    public String test() {
        return "Query & Clue backend is working!";
    }
}