package com.myfoundation.school.contact;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactLocation {
    private String label;
    private List<String> lines;
    private String postalLabel;
    private String postalCode;
    private String mobile;
}
