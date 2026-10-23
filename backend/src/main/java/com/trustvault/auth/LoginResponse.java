
package com.trustvault.auth;

public record LoginResponse(
    Long id,
    String name,
    String email,
    String role,
    String message
) {}
