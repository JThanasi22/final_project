package main.config;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.calendar.CalendarScopes;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Configuration
public class GoogleOAuthConfig {
    private final String CLIENT_ID = "146728697992-vpptfkev5qcgvvbek94fqmprj0n1m19m.apps.googleusercontent.com";
    private final String CLIENT_SECRET = "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";

    @Bean
    public GoogleAuthorizationCodeFlow googleAuthorizationCodeFlow() throws IOException {
        return new GoogleAuthorizationCodeFlow.Builder(
                new NetHttpTransport(),
                JacksonFactory.getDefaultInstance(),
                CLIENT_ID,
                CLIENT_SECRET,
                List.of(CalendarScopes.CALENDAR, "openid", "email", "profile")) // 👈 ADD THESE
                .setAccessType("offline")
                .setApprovalPrompt("force") // Optional: ensures refreshToken is returned every time
                .build();
    }

}