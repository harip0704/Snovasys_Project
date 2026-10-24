
package com.trustvault;


import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentPermissionRepository
        extends JpaRepository<DocumentPermission, Long> {

    List<DocumentPermission>
    findAllByRecipient_EmailIgnoreCaseOrderByGrantedAtDesc(
            String email
    );

    Optional<DocumentPermission> findByDocument_IdAndRecipient_EmailIgnoreCase(
            Long documentId,
            String email
    );

    boolean existsByDocument_IdAndRecipient_EmailIgnoreCase(
            Long documentId,
            String email
    );

    List<DocumentPermission> findAllByDocument_Id(Long documentId);

    void deleteByDocument_IdAndRecipient_Id(
            Long documentId,
            Long recipientId
    );
}
