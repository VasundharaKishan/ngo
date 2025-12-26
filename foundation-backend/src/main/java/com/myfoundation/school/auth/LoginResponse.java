package com.myfoundation.school.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String email;
    private String fullName;
    private UserRole role;
    private boolean otpRequired;

    public static LoginResponse withToken(AdminUser user, String token) {
        return new LoginResponse(token, user.getUsername(), user.getEmail(), user.getFullName(), user.getRole(), false);
    }

    public static LoginResponse otpRequired(AdminUser user) {
        return new LoginResponse(null, user.getUsername(), user.getEmail(), user.getFullName(), user.getRole(), true);
    }
}
