CREATE TABLE erasure_requests (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email VARCHAR(255) NOT NULL,
    reason VARCHAR(1000),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    processed_by VARCHAR(255),
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
