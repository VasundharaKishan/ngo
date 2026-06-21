package com.myfoundation.school.donation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class ReceiptTokenServiceTest {

    private ReceiptTokenService service;

    private static final String SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    private static final String DONATION_ID = "don-abc-123";

    @BeforeEach
    void setUp() {
        service = new ReceiptTokenService();
        ReflectionTestUtils.setField(service, "secret", SECRET);
        service.init();
    }

    @Test
    void generateToken_returnsNonEmptyJwt() {
        String token = service.generateToken(DONATION_ID);

        assertThat(token).isNotNull().isNotBlank();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    void validateToken_validTokenReturnsSubject() {
        String token = service.generateToken(DONATION_ID);

        Optional<String> result = service.validateToken(token, DONATION_ID);

        assertThat(result).isPresent().contains(DONATION_ID);
    }

    @Test
    void validateToken_wrongDonationIdReturnsEmpty() {
        String token = service.generateToken(DONATION_ID);

        Optional<String> result = service.validateToken(token, "wrong-id");

        assertThat(result).isEmpty();
    }

    @Test
    void validateToken_tamperedTokenReturnsEmpty() {
        String token = service.generateToken(DONATION_ID);
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";

        Optional<String> result = service.validateToken(tampered, DONATION_ID);

        assertThat(result).isEmpty();
    }

    @Test
    void validateToken_garbageStringReturnsEmpty() {
        Optional<String> result = service.validateToken("not.a.jwt", DONATION_ID);

        assertThat(result).isEmpty();
    }

    @Test
    void validateToken_emptyStringReturnsEmpty() {
        Optional<String> result = service.validateToken("", DONATION_ID);

        assertThat(result).isEmpty();
    }

    @Test
    void validateToken_tokenFromDifferentKeyReturnsEmpty() {
        ReceiptTokenService otherService = new ReceiptTokenService();
        ReflectionTestUtils.setField(otherService, "secret",
                "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789");
        otherService.init();

        String token = otherService.generateToken(DONATION_ID);

        Optional<String> result = service.validateToken(token, DONATION_ID);

        assertThat(result).isEmpty();
    }

    @Test
    void generateToken_differentIdsProduceDifferentTokens() {
        String token1 = service.generateToken("donation-1");
        String token2 = service.generateToken("donation-2");

        assertThat(token1).isNotEqualTo(token2);
    }
}
