package main.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")  // Allow all origins
                .allowedMethods("*")  // Allow all methods
                .allowedHeaders("*")  // Allow all headers
                .maxAge(3600);        // Cache preflight for 1 hour
        
        System.out.println("✅ CORS configuration applied with all origins allowed");
    }
}