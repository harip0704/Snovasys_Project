
package com.trustvault;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @GetMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> adminTest() {
        return Map.of(
            "status", "success",
            "message", "Admin access granted"
        );
    }
}
