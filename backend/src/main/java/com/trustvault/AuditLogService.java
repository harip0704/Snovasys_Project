
package com.trustvault;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(
            String actorEmail,
            Long documentId,
            String action,
            String result) {

        log(actorEmail, documentId, action, result, null);
    }

    @Transactional
    public void log(
            String actorEmail,
            Long documentId,
            String action,
            String result,
            String details) {

        AuditLog auditLog = new AuditLog(
                actorEmail,
                action,
                documentId,
                result,
                details
        );

        auditLogRepository.save(auditLog);
    }

    @Transactional
    public void recordEvent(
            String actorEmail,
            String action,
            Long documentId,
            String result,
            String details) {

        AuditLog auditLog = new AuditLog(
                actorEmail,
                action,
                documentId,
                result,
                details
        );

        auditLogRepository.save(auditLog);
    }
}
