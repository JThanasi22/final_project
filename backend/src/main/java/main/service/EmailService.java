package main.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetCode(String toEmail, String code) {
        String subject = "Your Password Reset Code";
        String body = "Use this code to reset your password: " + code + "\n\nThis code will expire in 15 minutes.";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
        System.out.println("📧 Reset code sent to: " + toEmail);
    }

    public void sendWelcomeEmail(String toEmail, String name) {
        String subject = "Welcome to Studio21 – Let’s Create Something Beautiful Together!";

        String body = "Hi " + name + ",\n\n" +
                "Welcome to **Studio21** – we're absolutely delighted to have you join our creative family!\n\n" +
                "Whether you're looking to capture timeless memories, create captivating videos, or bring your next big project to life, you're in the right place. " +
                "At Studio21, we specialize in professional photography and videography, delivering personalized, high-quality results that speak for themselves.\n\n" +
                "Here’s what you can expect:\n" +
                "📷 Expert photographers and videographers at your service\n" +
                "🎬 Creative storytelling tailored to your vision\n" +
                "🤝 A seamless, friendly, and collaborative experience\n\n" +
                "We can’t wait to get started on your next project. If you have any questions, feel free to reach out – we’re always here to help.\n\n" +
                "Warm regards,\n" +
                "The Studio21 Team 📸✨";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
        System.out.println("📧 Welcome email sent to: " + toEmail);
    }


}
