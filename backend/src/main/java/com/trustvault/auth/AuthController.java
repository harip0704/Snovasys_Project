
package com.trustvault.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;

    public AuthController(
            AuthService authService,
            AuthenticationManager authenticationManager) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(
            @Valid @RequestBody SignupRequest request) {

        SignupResponse response = authService.signup(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        Authentication authentication =
                authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                        request.email().trim().toLowerCase(),
                        request.password()
                    )
                );

        // Create the authenticated security context.
        SecurityContext context =
                SecurityContextHolder.createEmptyContext();

        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        // Create a session and save the security context.
        HttpSession session = httpRequest.getSession(true);

        session.setAttribute(
            HttpSessionSecurityContextRepository
                .SPRING_SECURITY_CONTEXT_KEY,
            context
        );

        return ResponseEntity.ok(
            authService.login(request)
        );
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> currentUser(
            Authentication authentication) {

        return ResponseEntity.ok(Map.of(
            "email", authentication.getName(),
            "authenticated", authentication.isAuthenticated(),
            "authorities", authentication.getAuthorities()
                    .stream()
                    .map(authority -> authority.getAuthority())
                    .toList()
        ));
    }
}
