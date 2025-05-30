package main.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import main.model.User;

import java.util.Date;
import java.security.Key;

public class JwtUtil {
    private static final long EXPIRATION_TIME = 86400000; // 1 day
    private static final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    public static String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail())              // stays the same
                .claim("id", user.getId())
                .claim("name", user.getName())            // custom claim
                .claim("role", user.getRole())            // custom claim
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SECRET_KEY)
                .compact();
    }

    public static boolean validateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(SECRET_KEY)
                    .parseClaimsJws(token)
                    .getBody();

            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            System.out.println("❌ Token validation error: " + e.getMessage());
            return false;
        }
    }


    public static String extractEmail(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(SECRET_KEY)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception e) {
            System.err.println("❌ Error extracting email from token: " + e.getMessage());
            return null;
        }
    }
    public static String extractUserId(String token) {
        return Jwts.parser()
                .setSigningKey(SECRET_KEY)
                .parseClaimsJws(token)
                .getBody()
                .get("id", String.class);  // Getting the "id" claim from your token
    }
    public static String extractRole(String token) {
        return Jwts.parser()
                .setSigningKey(SECRET_KEY)
                .parseClaimsJws(token)
                .getBody()
                .get("role", String.class);
    }
}
