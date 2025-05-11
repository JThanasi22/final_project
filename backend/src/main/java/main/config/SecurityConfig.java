package main.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        // Allow preflight OPTIONS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // WebSocket endpoints
                        .requestMatchers("/ws/**", "/app/**", "/topic/**").permitAll()

                        // Public portfolio access
                        .requestMatchers("/api/portfolios/**").permitAll()

                        // File endpoints
                        .requestMatchers("/api/files/**").permitAll()

                        // Auth and password reset
                        .requestMatchers("/api/users/signup", "/api/users/login",
                                "/api/users/request-reset", "/api/users/verify-reset-code",
                                "/api/users/reset-password").permitAll()

                        // Active project media download (✅ add permission here)
                        .requestMatchers(HttpMethod.GET, "/api/active_projects/download_media").authenticated()

                        // Active projects finish endpoint (✅ add permission here)
                        .requestMatchers(HttpMethod.POST, "/api/finished_projects").authenticated()

                        // Authenticated user info
                        .requestMatchers("/api/users/me", "/api/users/update").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/email/**").authenticated()

                        // Projects and messages
                        .requestMatchers("/api/projects/**").authenticated()
                        .requestMatchers("/api/messages/**").authenticated()

                        // Catch-all
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:5173")); // React dev origin
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
