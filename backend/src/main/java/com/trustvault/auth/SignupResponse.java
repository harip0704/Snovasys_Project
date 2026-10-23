
package com.trustvault.auth;

public record SignupResponse(
    Long id,
    String name,
    String email,
    String role,
    String message
) {}
