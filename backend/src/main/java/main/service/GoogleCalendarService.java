package main.service;

import com.google.api.client.auth.oauth2.BearerToken;
import com.google.api.client.auth.oauth2.ClientParametersAuthentication;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenRequest;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.Events;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

@Service
public class GoogleCalendarService {

    private static final String APPLICATION_NAME = "Studio21 Central Calendar";
    private static final String CLIENT_ID = "146728697992-vpptfkev5qcgvvbek94fqmprj0n1m19m.apps.googleusercontent.com";
    private static final String CLIENT_SECRET = "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";
    private static final String TOKEN_SERVER_URL = "https://oauth2.googleapis.com/token";

    public static Credential createCredentialFromRefreshToken(String refreshToken) throws IOException {
        try {
            NetHttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();

            Credential credential = new Credential.Builder(BearerToken.authorizationHeaderAccessMethod())
                    .setTransport(transport)
                    .setJsonFactory(JacksonFactory.getDefaultInstance())
                    .setClientAuthentication(new ClientParametersAuthentication(CLIENT_ID, CLIENT_SECRET))
                    .setTokenServerUrl(new GenericUrl(TOKEN_SERVER_URL))
                    .build();

            credential.setRefreshToken(refreshToken);
            credential.refreshToken();

            return credential;
        } catch (GeneralSecurityException e) {
            throw new IOException("Security exception while creating credential", e);
        }
    }

    public Calendar getCalendarService(Credential credential) throws IOException {
        try {
            return new Calendar.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    JacksonFactory.getDefaultInstance(),
                    credential)
                    .setApplicationName(APPLICATION_NAME)
                    .build();
        } catch (GeneralSecurityException e) {
            throw new IOException("Security error initializing calendar service", e);
        }
    }

    public List<Event> getUpcomingEvents(Credential credential) throws IOException {
        Calendar service = getCalendarService(credential);

        DateTime now = new DateTime(System.currentTimeMillis());
        Events events = service.events().list("primary")
                .setMaxResults(20)
                .setTimeMin(now)
                .setOrderBy("startTime")
                .setSingleEvents(true)
                .execute();

        return events.getItems();
    }
}
