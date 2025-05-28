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
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/google/**").permitAll()
                        .requestMatchers("/google/oauth2callback").permitAll()
                        .requestMatchers("/ws/**", "/app/**", "/topic/**").permitAll()
                        .requestMatchers("/api/portfolios/**").permitAll()
                        .requestMatchers("/api/files/**").permitAll()
                        .requestMatchers("/api/users/signup", "/api/users/login",
                                "/api/users/request-reset", "/api/users/verify-reset-code",
                                "/api/users/reset-password", "/api/users/verify-2fa").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/active_projects/download_media").authenticated()
                        .requestMatchers("/api/notifications/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/finished_projects").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/payment/webhook").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/pending-projects/mark-paid").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/notifications/**").authenticated()
                        .requestMatchers("/api/google/events").authenticated()
                        .requestMatchers("/api/users/me", "/api/users/update").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/email/**").authenticated()
                        .requestMatchers("/api/projects/**").authenticated()
                        .requestMatchers("/api/client-projects/**").authenticated()
                        .requestMatchers("/api/messages/**").authenticated()
                        .requestMatchers("/api/my-projects").authenticated()
                        .requestMatchers("/api/invoices/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/my-projects").authenticated()
                        .requestMatchers("/api/feedback/**").authenticated()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:5173")); // ✅ Use allowedOriginPatterns
        config.setAllowCredentials(true); // ✅ Must be true to allow cookies or Authorization headers
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }




    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
