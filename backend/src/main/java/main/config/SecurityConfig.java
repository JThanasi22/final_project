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
                        // Order matters - most specific first
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // WebSocket endpoints
                        .requestMatchers("/ws/**", "/app/**", "/topic/**").permitAll()

                        // Public portfolio access
                        .requestMatchers(HttpMethod.GET, "/api/portfolios/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/portfolios/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/portfolios/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/portfolios/**").permitAll()

                        // File endpoints
                        .requestMatchers("/api/files/**").permitAll()

                        // Auth and password reset
                        .requestMatchers("/api/users/signup").permitAll()
                        .requestMatchers("/api/users/login").permitAll()
                        .requestMatchers("/api/users/request-reset").permitAll()
                        .requestMatchers("/api/users/verify-reset-code").permitAll()
                        .requestMatchers("/api/users/reset-password").permitAll()

                        // ✅ Allow email lookup only for authenticated users
                        .requestMatchers(HttpMethod.GET, "/api/users/email/**").authenticated()

                        // Authenticated user info
                        .requestMatchers("/api/users/me").authenticated()
                        .requestMatchers("/api/users/update").authenticated()

                        // Projects
                        .requestMatchers("/api/projects", "/api/projects/**").authenticated()

                        // Messages
                        .requestMatchers(HttpMethod.GET, "/api/messages/conversations/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/messages/**").authenticated()

                        // Catch-all
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:5173")); // use patterns instead of "*"
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // now allowed with origin patterns

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
