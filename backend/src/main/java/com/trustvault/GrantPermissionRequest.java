
package com.trustvault;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GrantPermissionRequest(

        @NotBlank(message = "Recipient email is required")
        @Email(message = "Enter a valid recipient email address")
        @Size(max = 254, message = "Recipient email is too long")
        String recipientEmail,

        @NotNull(message = "Permission type is required")
        PermissionType permissionType

) {
}
