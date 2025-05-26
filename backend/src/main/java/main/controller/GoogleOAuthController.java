package main.controller;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.json.jackson2.JacksonFactory;
import jakarta.servlet.http.HttpServletResponse;
import main.service.FirestoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/google")
public class GoogleOAuthController {

    @Autowired
    private GoogleAuthorizationCodeFlow flow;

    private final FirestoreService firestoreService;

    private final String REDIRECT_URI = "http://localhost:8080/google/oauth2callback";

    public GoogleOAuthController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping("/auth")
    public void authorize(HttpServletResponse response) throws IOException {
        String url = flow.newAuthorizationUrl().setRedirectUri(REDIRECT_URI).build();
        response.sendRedirect(url);
    }

    @GetMapping("/oauth2callback")
    public void oauth2callback(@RequestParam("code") String code, HttpServletResponse response) throws Exception {
        TokenResponse tokenResponse = flow.newTokenRequest(code).setRedirectUri(REDIRECT_URI).execute();
        Credential credential = flow.createAndStoreCredential(tokenResponse, "studio21-central");

        // Only attempt to parse ID token if it's present
        String idTokenString = tokenResponse.get("id_token") != null ? tokenResponse.get("id_token").toString() : null;

        if (idTokenString != null) {
            GoogleIdToken idToken = GoogleIdToken.parse(JacksonFactory.getDefaultInstance(), idTokenString);
            String email = idToken.getPayload().getEmail();

            String refreshToken = tokenResponse.getRefreshToken();
            if (refreshToken != null && email != null) {
                firestoreService.attachGoogleCalendarToken(email, refreshToken);
            }
        } else {
            System.out.println("⚠️ No ID token returned by Google. Cannot determine user email.");
        }

        response.sendRedirect("http://localhost:5173/usersettings?calendar=success");
    }
}
