package main.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import main.util.JwtUtil;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestPath = URLDecoder.decode(request.getRequestURI(), StandardCharsets.UTF_8);
        System.out.println("🔍 Request Path: " + requestPath);

        // Public endpoints — skip JWT check
        if (requestPath != null && (
                requestPath.startsWith("/api/portfolios") ||
                        requestPath.startsWith("/api/files") ||
                        requestPath.equals("/api/users/signup") ||
                        requestPath.equals("/api/users/loginr") ||
                        requestPath.equals("/api/users/request-reset") ||
                        requestPath.equals("/api/users/verify-reset-code") ||
                        requestPath.equals("/api/users/reset-password") ||
                        requestPath.startsWith("/api/users/email/") ||
                        requestPath.startsWith("/ws")
        )) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract Bearer token
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            String email = JwtUtil.extractEmail(token);
            String role = JwtUtil.extractRole(token);
            String userId = JwtUtil.extractUserId(token);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + role.toUpperCase())
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, authorities);

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                System.out.println("📨 Incoming token: " + authHeader);
                System.out.println("🔐 Extracted userId: " + userId);
                System.out.println("📧 Extracted email: " + email);
            }
        }

        filterChain.doFilter(request, response);
    }
}
