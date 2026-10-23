
package com.trustvault;

import com.trustvault.user.User;
import com.trustvault.user.UserRepository;

import java.util.List;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public DocumentService(
            DocumentRepository documentRepository,
            UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Document> getMyDocuments(String email) {

        User user = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found"));

        return documentRepository
                .findAllByOwner_IdOrderByUploadedAtDesc(user.getId());
    }
}
