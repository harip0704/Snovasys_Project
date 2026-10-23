
package com.trustvault.auth;

import com.trustvault.user.User;
import com.trustvault.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public SignupResponse signup(SignupRequest request) {

        String name = request.name().trim();
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account with this email already exists"
            );
        }

        String passwordHash =
            passwordEncoder.encode(request.password());

        User user = new User(name, email, passwordHash);
        User savedUser = userRepository.save(user);

        return new SignupResponse(
            savedUser.getId(),
            savedUser.getName(),
            savedUser.getEmail(),
            savedUser.getRole().name(),
            "Account created successfully"
        );
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {

        String email = request.email().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password"
            ));

        if (!passwordEncoder.matches(
                request.password(),
                user.getPasswordHash())) {

            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password"
            );
        }

        return new LoginResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole().name(),
            "Login successful"
        );
    }
}
