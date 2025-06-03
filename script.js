// Variables globales
let files = [];
let currentSort = 'name';
let searchTerms = {};

// Éléments DOM
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const modal = document.getElementById('fileModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateStats();
    loadStoredFiles();
});

// Initialisation des événements
function initializeEventListeners() {
    // Événements pour le drag & drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        uploadArea.addEventListener('click', () => fileInput.click());
    }

    // Événement pour la sélection de fichiers
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Événements pour la modal
    if (closeModal) {
        closeModal.addEventListener('click', closeFileModal);
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeFileModal();
            }
        });
    }

    // Événement pour fermer la modal avec Échap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeFileModal();
        }
    });

    // Initialiser les termes de recherche
    searchTerms = {
        image: '',
        video: '',
        document: '',
        all: ''
    };
}

// Gestion des tabs
function showTab(tabName) {
    // Cacher toutes les sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Désactiver tous les tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Activer le tab sélectionné
    const targetSection = document.getElementById(tabName);
    const clickedTab = event.target;
    
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    if (clickedTab) {
        clickedTab.classList.add('active');
    }
}

// Gestion du drag & drop
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
}

function handleFileSelect(e) {
    const selectedFiles = e.target.files;
    handleFiles(selectedFiles);
}

// Traitement des fichiers
function handleFiles(fileList) {
    if (fileList.length === 0) return;

    showUploadProgress();
    let totalFiles = fileList.length;
    let processedFiles = 0;

    Array.from(fileList).forEach((file, index) => {
        setTimeout(() => {
            if (file.size > 12 * 1024 * 1024 * 1024) { // 12GB limit
                alert(`Le fichier ${file.name} dépasse la limite de 12GB`);
            } else {
                addFile(file);
            }
            
            processedFiles++;
            updateUploadProgress((processedFiles / totalFiles) * 100);
            
            if (processedFiles === totalFiles) {
                setTimeout(() => {
                    hideUploadProgress();
                    updateStats();
                    renderAllGrids();
                    saveFilesToStorage();
                }, 500);
            }
        }, index * 100);
    });
}

// Ajouter un fichier
function addFile(file) {
    const fileObj = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        file: file,
        uploadDate: new Date(),
        category: getFileCategory(file.type, file.name),
        url: URL.createObjectURL(file)
    };
    
    files.push(fileObj);
}

// Déterminer la catégorie du fichier
function getFileCategory(mimeType, fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv'];
    
    if (mimeType.startsWith('image/') || imageExtensions.includes(extension)) {
        return 'image';
    } else if (mimeType.startsWith('video/') || videoExtensions.includes(extension)) {
        return 'video';
    } else {
        return 'document';
    }
}

// Créer une carte de fichier
function createFileCard(file) {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.setAttribute('data-file-id', file.id);
    
    let previewContent;
    if (file.category === 'image') {
        previewContent = `<img src="${file.url}" alt="${file.name}" loading="lazy" onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\\"file-icon\\">🖼️</div>'">`;
    } else if (file.category === 'video') {
        previewContent = `<video src="${file.url}" muted preload="metadata" onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\\"file-icon\\">🎥</div>'"></video>`;
    } else {
        const icon = getFileIcon(file.name);
        previewContent = `<div class="file-icon">${icon}</div>`;
    }
    
    card.innerHTML = `
        <div class="file-preview">
            ${previewContent}
        </div>
        <div class="file-info">
            <div class="file-name" title="${file.name}">${truncateFileName(file.name, 30)}</div>
            <div class="file-meta">
                ${formatFileSize(file.size)} • ${file.category}
            </div>
            <div class="file-date">
                Ajouté le ${file.uploadDate.toLocaleDateString('fr-FR')}
            </div>
            <div class="file-actions">
                <button class="btn btn-small btn-view" onclick="viewFile('${file.id}')" title="Prévisualiser">
                    👁️ Voir
                </button>
                <button class="btn btn-small btn-download" onclick="downloadFile('${file.id}')" title="Télécharger">
                    📥 Télécharger
                </button>
                <button class="btn btn-small btn-delete" onclick="deleteFile('${file.id}')" title="Supprimer">
                    🗑️ Supprimer
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Obtenir l'icône du fichier
function getFileIcon(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
        // Documents
        pdf: '📄', doc: '📝', docx: '📝', txt: '📝', rtf: '📝',
        // Tableurs
        xls: '📊', xlsx: '📊', csv: '📊',
        // Présentations
        ppt: '📊', pptx: '📊',
        // Archives
        zip: '🗜️', rar: '🗜️', '7z': '🗜️', tar: '🗜️', gz: '🗜️',
        // Audio
        mp3: '🎵', wav: '🎵', flac: '🎵', aac: '🎵', ogg: '🎵',
        // Code
        js: '💻', html: '💻', css: '💻', php: '💻', py: '💻', java: '💻',
        // Autres
        exe: '⚙️', msi: '⚙️', app: '⚙️',
        default: '📁'
    };
    return iconMap[extension] || iconMap.default;
}

// Tronquer le nom de fichier
function truncateFileName(fileName, maxLength) {
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop();
    const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
    const maxNameLength = maxLength - extension.length - 4; // -4 pour "..." et "."
    
    return nameWithoutExtension.substring(0, maxNameLength) + '...' + extension;
}

// Rendre toutes les grilles
function renderAllGrids() {
    const imageGrid = document.getElementById('imageGrid');
    const videoGrid = document.getElementById('videoGrid');
    const documentGrid = document.getElementById('documentGrid');
    const allGrid = document.getElementById('allGrid');
    
    // Vider les grilles
    [imageGrid, videoGrid, documentGrid, allGrid].forEach(grid => {
        if (grid) grid.innerHTML = '';
    });
    
    // Filtrer et trier les fichiers
    const sortedFiles = getSortedFiles();
    
    sortedFiles.forEach(file => {
        // Appliquer les filtres de recherche
        const searchTerm = searchTerms[file.category] || '';
        const allSearchTerm = searchTerms.all || '';
        
        const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             file.name.toLowerCase().includes(allSearchTerm.toLowerCase());
        
        if (matchesSearch) {
            const card = createFileCard(file);
            
            // Ajouter à la grille appropriée
            if (file.category === 'image' && imageGrid) {
                imageGrid.appendChild(card.cloneNode(true));
            } else if (file.category === 'video' && videoGrid) {
                videoGrid.appendChild(card.cloneNode(true));
            } else if (file.category === 'document' && documentGrid) {
                documentGrid.appendChild(card.cloneNode(true));
            }
            
            // Ajouter à la grille "tous" si correspond à la recherche globale
            if (allGrid && file.name.toLowerCase().includes(allSearchTerm.toLowerCase())) {
                allGrid.appendChild(card);
            }
        }
    });
    
    // Réattacher les événements aux nouveaux éléments
    attachCardEvents();
}

// Attacher les événements aux cartes
function attachCardEvents() {
    document.querySelectorAll('.file-card').forEach(card => {
        const fileId = card.getAttribute('data-file-id');
        
        // Double-clic pour prévisualiser
        card.addEventListener('dblclick', () => viewFile(fileId));
        
        // Hover effects
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Obtenir les fichiers triés
function getSortedFiles() {
    return [...files].sort((a, b) => {
        switch (currentSort) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'date':
                return new Date(b.uploadDate) - new Date(a.uploadDate);
            case 'size':
                return b.size - a.size;
            case 'type':
                return a.category.localeCompare(b.category);
            default:
                return 0;
        }
    });
}

// Prévisualiser un fichier
function viewFile(fileId) {
    const file = files.find(f => f.id == fileId);
    if (!file) return;
    
    modalTitle.textContent = file.name;
    modalBody.innerHTML = '';
    
    if (file.category === 'image') {
        const img = document.createElement('img');
        img.src = file.url;
        img.alt = file.name;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '70vh';
        img.style.objectFit = 'contain';
        modalBody.appendChild(img);
    } else if (file.category === 'video') {
        const video = document.createElement('video');
        video.src = file.url;
        video.controls = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '70vh';
        modalBody.appendChild(video);
    } else {
        // Pour les documents, afficher les informations
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 4em; margin-bottom: 20px;">${getFileIcon(file.name)}</div>
                <h3 style="margin-bottom: 15px; color: #2c5aa0;">${file.name}</h3>
                <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p><strong>Taille:</strong> ${formatFileSize(file.size)}</p>
                    <p><strong>Type:</strong> ${file.type}</p>
                    <p><strong>Catégorie:</strong> ${file.category}</p>
                    <p><strong>Date d'ajout:</strong> ${file.uploadDate.toLocaleDateString('fr-FR')} à ${file.uploadDate.toLocaleTimeString('fr-FR')}</p>
                </div>
                <button class="btn" onclick="downloadFile('${file.id}'); closeFileModal();" style="margin-top: 20px;">
                    📥 Télécharger pour ouvrir
                </button>
            </div>
        `;
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Empêcher le scroll en arrière-plan
}

// Télécharger un fichier
function downloadFile(fileId) {
    const file = files.find(f => f.id == fileId);
    if (file) {
        const a = document.createElement('a');
        a.href = file.url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Notification
        showNotification(`Téléchargement de "${file.name}" démarré`, 'success');
    }
}

// Supprimer un fichier
function deleteFile(fileId) {
    const file = files.find(f => f.id == fileId);
    if (!file) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${file.name}" ?`)) {
        // Libérer l'URL de l'objet
        URL.revokeObjectURL(file.url);
        
        // Supprimer le fichier de la liste
        files = files.filter(f => f.id != fileId);
        
        // Mettre à jour l'affichage
        renderAllGrids();
        updateStats();
        saveFilesToStorage();
        
        showNotification(`"${file.name}" a été supprimé`, 'success');
    }
}

// Fermer la modal
function closeFileModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Réactiver le scroll
}

// Rechercher des fichiers
function searchFiles(category, searchTerm) {
    searchTerms[category] = searchTerm;
    renderAllGrids();
}

// Trier les fichiers
function sortFiles(sortBy) {
    currentSort = sortBy;
    renderAllGrids();
}

// Formater la taille des fichiers
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Mettre à jour les statistiques
function updateStats() {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalImages = files.filter(f => f.category === 'image').length;
    const totalVideos = files.filter(f => f.category === 'video').length;
    
    const elements = {
        totalFiles: document.getElementById('totalFiles'),
        totalImages: document.getElementById('totalImages'),
        totalVideos: document.getElementById('totalVideos'),
        totalSize: document.getElementById('totalSize')
    };
    
    if (elements.totalFiles) elements.totalFiles.textContent = files.length;
    if (elements.totalImages) elements.totalImages.textContent = totalImages;
    if (elements.totalVideos) elements.totalVideos.textContent = totalVideos;
    if (elements.totalSize) elements.totalSize.textContent = formatFileSize(totalSize);
}

// Afficher la progression du téléchargement
function showUploadProgress() {
    if (uploadProgress) {
        uploadProgress.style.display = 'block';
        progressText.textContent = 'Traitement des fichiers...';
    }
}

// Mettre à jour la progression
function updateUploadProgress(percent) {
    if (progressFill && progressText) {
        progressFill.style.width = percent + '%';
        progressText.textContent = `Traitement... ${Math.round(percent)}%`;
    }
}

// Cacher la progression
function hideUploadProgress() {
    if (uploadProgress) {
        uploadProgress.style.display = 'none';
    }
}

// Afficher une notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animation d'apparition
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Suppression automatique
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Sauvegarder les fichiers (métadonnées uniquement)
function saveFilesToStorage() {
    try {
        const fileMetadata = files.map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            category: file.category,
            uploadDate: file.uploadDate.toISOString()
        }));
        
        // Note: On ne peut pas sauvegarder les vrais fichiers en localStorage
        // On sauvegarde seulement les métadonnées pour la démonstration
        localStorage.setItem('rakotondranaivo_files_metadata', JSON.stringify(fileMetadata));
    } catch (error) {
        console.warn('Impossible de sauvegarder les métadonnées:', error);
    }
}

// Charger les fichiers sauvegardés
function loadStoredFiles() {
    try {
        const stored = localStorage.getItem('rakotondranaivo_files_metadata');
        if (stored) {
            const metadata = JSON.parse(stored);
            console.log(`${metadata.length} fichiers trouvés dans le stockage local (métadonnées uniquement)`);
            // Note: On ne peut pas restaurer les vrais fichiers, seulement les métadonnées
        }
    } catch (error) {
        console.warn('Impossible de charger les métadonnées:', error);
    }
}

// Fonction utilitaire pour effacer toutes les données
function clearAllData() {
    if (confirm('Êtes-vous sûr de vouloir supprimer tous les fichiers ? Cette action est irréversible.')) {
        // Libérer toutes les URLs d'objets
        files.forEach(file => {
            if (file.url) {
                URL.revokeObjectURL(file.url);
            }
        });
        
        // Vider la liste des fichiers
        files = [];
        
        // Effacer le stockage local
        localStorage.removeItem('rakotondranaivo_files_metadata');
        
        // Mettre à jour l'affichage
        renderAllGrids();
        updateStats();
        
        showNotification('Tous les fichiers ont été supprimés', 'success');
    }
}

// Fonctions d'export (pour usage futur)
function exportFileList() {
    const fileList = files.map(file => ({
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        category: file.category,
        uploadDate: file.uploadDate.toLocaleDateString('fr-FR')
    }));
    
    const dataStr = JSON.stringify(fileList, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'liste_fichiers_rakotondranaivo.json';
    link.click();
    
    showNotification('Liste des fichiers exportée', 'success');
}

// Gestion du redimensionnement de la fenêtre
window.addEventListener('resize', function() {
    // Ajuster la modal si elle est ouverte
    if (modal && modal.style.display === 'block') {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.maxWidth = '90vw';
            modalContent.style.maxHeight = '90vh';
        }
    }
});

// Debug: Fonction pour tester avec des fichiers factices
function addTestFiles() {
    const testFiles = [
        { name: 'photo_famille.jpg', size: 2048000, type: 'image/jpeg' },
        { name: 'video_anniversaire.mp4', size: 50000000, type: 'video/mp4' },
        { name: 'document_important.pdf', size: 1024000, type: 'application/pdf' }
    ];
    
    testFiles.forEach(testFile => {
        const blob = new Blob(['test content'], { type: testFile.type });
        const file = new File([blob], testFile.name, { type: testFile.type });
        addFile(file);
    });
    
    updateStats();
    renderAllGrids();
    saveFilesToStorage();
    
    showNotification('Fichiers de test ajoutés', 'success');
}

// Console helper
console.log('🏠 Site Rakotondranaivo chargé avec succès!');
console.log('💡 Tapez addTestFiles() dans la console pour ajouter des fichiers de test');
console.log('🗑️ Tapez clearAllData() dans la console pour effacer toutes les données');