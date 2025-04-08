package main.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetConfirmationLink(String toEmail, String confirmationLink) {
        String subject = "Password Reset Confirmation";
        String body = "Click the link below to confirm your password reset:\n\n" + confirmationLink;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
        System.out.println("📧 Reset confirmation email sent to: " + toEmail);
    }
}
