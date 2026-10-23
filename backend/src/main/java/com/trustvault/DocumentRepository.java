
package com.trustvault;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    // Particular owner ki sambandhinchina documents matrame retrieve chestundi.
    List<Document> findAllByOwner_IdOrderByUploadedAtDesc(Long ownerId);

    // Document ID + Owner ID rendu match ayithe matrame retrieve chestundi.
    Optional<Document> findByIdAndOwner_Id(Long documentId, Long ownerId);
}
