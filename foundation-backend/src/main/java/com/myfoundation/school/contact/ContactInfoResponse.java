package com.myfoundation.school.contact;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactInfoResponse {
    private String email;
    private List<ContactLocation> locations;
    private Boolean showInFooter;
}
