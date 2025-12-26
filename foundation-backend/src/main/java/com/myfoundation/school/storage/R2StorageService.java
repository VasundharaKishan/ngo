package com.myfoundation.school.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.utils.StringUtils;

import java.net.URI;

@Service
@RequiredArgsConstructor
@Slf4j
public class R2StorageService {

    @Value("${storage.r2.endpoint}")
    private String endpoint;

    @Value("${storage.r2.bucket}")
    private String bucket;

    @Value("${storage.r2.access-key}")
    private String accessKey;

    @Value("${storage.r2.secret-key}")
    private String secretKey;

    @Value("${storage.r2.public-base-url:}")
    private String publicBaseUrl;

    public String upload(String key, byte[] bytes, String contentType) {
        try (S3Client client = buildClient()) {
            PutObjectRequest put = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(contentType)
                    .build();
            client.putObject(put, RequestBody.fromBytes(bytes));
            return buildPublicUrl(key);
        }
    }

    public void delete(String key) {
        try (S3Client client = buildClient()) {
            DeleteObjectRequest del = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();
            client.deleteObject(del);
        }
    }

    private S3Client buildClient() {
        return S3Client.builder()
                .region(Region.US_EAST_1) // region is ignored by R2 but required by SDK
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .endpointOverride(URI.create(endpoint))
                .build();
    }

    private String buildPublicUrl(String key) {
        if (StringUtils.isNotBlank(publicBaseUrl)) {
            return publicBaseUrl.endsWith("/") ? publicBaseUrl + key : publicBaseUrl + "/" + key;
        }
        // fallback to direct R2 endpoint
        String trimmedEndpoint = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
        return String.format("%s/%s/%s", trimmedEndpoint, bucket, key);
    }
}
