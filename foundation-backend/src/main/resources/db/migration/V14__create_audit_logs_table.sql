CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    actor_username VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_audit_action ON audit_logs (action);
CREATE INDEX idx_audit_actor ON audit_logs (actor_username);
CREATE INDEX idx_audit_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);
