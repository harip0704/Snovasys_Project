
package com.trustvault;

import com.trustvault.user.CustomUserDetailsService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            CustomUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);

        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration)
            throws Exception {

        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:5174"
        ));

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of(
                "Content-Type",
                "Authorization",
                "X-Requested-With"
        ));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/api/**", configuration);

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            DaoAuthenticationProvider authenticationProvider)
            throws Exception {

        http
            .cors(Customizer.withDefaults())

            .authenticationProvider(authenticationProvider)

            .csrf(csrf -> csrf.disable())

            .exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) ->
                    response.sendError(
                        HttpServletResponse.SC_UNAUTHORIZED
                    )
                )
            )

            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/health").permitAll()

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/signup",
                    "/api/auth/login"
                ).permitAll()

                // OAuth2 login endpoints and callback paths.
                .requestMatchers(
                    "/oauth2/**",
                    "/login/oauth2/**"
                ).permitAll()

                .anyRequest().authenticated()
            )

            .formLogin(form -> form.disable())

            .httpBasic(basic -> basic.disable())

            .oauth2Login(oauth2 -> oauth2
                .defaultSuccessUrl(
                    "http://localhost:5173/dashboard",
                    true
                )
                .failureUrl(
                    "http://localhost:5173/login?oauthError=true"
                )
            )

            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((request, response, authentication) ->
                    response.setStatus(
                        HttpServletResponse.SC_NO_CONTENT
                    )
                )
            );

        return http.build();
    }
}
