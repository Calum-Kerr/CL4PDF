/**
 * SnackPDF Merge PDF Tool
 * Handles file upload, drag & drop, reordering, and PDF merging
 */

class MergePDFTool {
    constructor() {
        this.files = [];
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.maxFiles = 20;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeDragAndDrop();
    }
    
    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.selectFilesBtn = document.getElementById('selectFilesBtn');
        this.addMoreFilesBtn = document.getElementById('addMoreFiles');
        this.fileList = document.getElementById('fileList');
        this.filesContainer = document.getElementById('filesContainer');
        this.mergeBtn = document.getElementById('mergeBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.processingSection = document.getElementById('processingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.progressBar = document.getElementById('progressBar');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.mergeAnotherBtn = document.getElementById('mergeAnotherBtn');
    }
    
    bindEvents() {
        // File selection events
        this.selectFilesBtn.addEventListener('click', () => this.fileInput.click());
        this.addMoreFilesBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Action button events
        this.mergeBtn.addEventListener('click', () => this.mergePDFs());
        this.clearAllBtn.addEventListener('click', () => this.clearAllFiles());
        this.downloadBtn.addEventListener('click', () => this.downloadResult());
        this.mergeAnotherBtn.addEventListener('click', () => this.resetTool());
        
        // Upload area click
        this.uploadArea.addEventListener('click', () => {
            if (this.files.length === 0) {
                this.fileInput.click();
            }
        });
    }
    
    initializeDragAndDrop() {
        // Drag and drop for file upload
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                this.uploadArea.classList.add('dragover');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                this.uploadArea.classList.remove('dragover');
            }, false);
        });
        
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.processFiles(files);
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        this.processFiles(files);
        // Reset input so same file can be selected again
        e.target.value = '';
    }
    
    processFiles(fileList) {
        const files = Array.from(fileList);
        const pdfFiles = files.filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            this.showToast('Please select PDF files only', 'warning');
            return;
        }
        
        if (this.files.length + pdfFiles.length > this.maxFiles) {
            this.showToast(`Maximum ${this.maxFiles} files allowed`, 'warning');
            return;
        }
        
        // Check file sizes
        const oversizedFiles = pdfFiles.filter(file => file.size > this.maxFileSize);
        if (oversizedFiles.length > 0) {
            this.showToast('Some files are too large (max 50MB per file)', 'warning');
            return;
        }
        
        // Add files to the list
        pdfFiles.forEach(file => {
            const fileObj = {
                id: this.generateId(),
                file: file,
                name: file.name,
                size: this.formatFileSize(file.size),
                sizeBytes: file.size
            };
            this.files.push(fileObj);
        });
        
        this.updateUI();
        this.trackEvent('files_added', {
            count: pdfFiles.length,
            total_files: this.files.length
        });
    }
    
    updateUI() {
        if (this.files.length > 0) {
            this.fileList.style.display = 'block';
            this.renderFileList();
        } else {
            this.fileList.style.display = 'none';
        }
    }
    
    renderFileList() {
        this.filesContainer.innerHTML = '';
        
        this.files.forEach((fileObj, index) => {
            const fileElement = this.createFileElement(fileObj, index);
            this.filesContainer.appendChild(fileElement);
        });
        
        // Initialize sortable for drag and drop reordering
        this.initializeSortable();
    }
    
    createFileElement(fileObj, index) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.dataset.fileId = fileObj.id;
        
        div.innerHTML = `
            <div class="drag-handle">
                <i class="bi bi-grip-vertical"></i>
            </div>
            <div class="file-icon">
                <i class="bi bi-file-earmark-pdf"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${this.escapeHtml(fileObj.name)}</div>
                <div class="file-size">${fileObj.size}</div>
            </div>
            <div class="file-actions">
                <button class="btn btn-sm btn-outline-secondary" onclick="mergeTool.moveFileUp(${index})" ${index === 0 ? 'disabled' : ''}>
                    <i class="bi bi-arrow-up"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="mergeTool.moveFileDown(${index})" ${index === this.files.length - 1 ? 'disabled' : ''}>
                    <i class="bi bi-arrow-down"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="mergeTool.removeFile('${fileObj.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        return div;
    }
    
    initializeSortable() {
        // Simple drag and drop implementation
        let draggedElement = null;
        
        this.filesContainer.querySelectorAll('.file-item').forEach(item => {
            item.draggable = true;
            
            item.addEventListener('dragstart', (e) => {
                draggedElement = item;
                item.classList.add('dragging');
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedElement = null;
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedElement && draggedElement !== item) {
                    const draggedId = draggedElement.dataset.fileId;
                    const targetId = item.dataset.fileId;
                    this.reorderFiles(draggedId, targetId);
                }
            });
        });
    }
    
    reorderFiles(draggedId, targetId) {
        const draggedIndex = this.files.findIndex(f => f.id === draggedId);
        const targetIndex = this.files.findIndex(f => f.id === targetId);
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            const draggedFile = this.files.splice(draggedIndex, 1)[0];
            this.files.splice(targetIndex, 0, draggedFile);
            this.renderFileList();
        }
    }
    
    moveFileUp(index) {
        if (index > 0) {
            [this.files[index], this.files[index - 1]] = [this.files[index - 1], this.files[index]];
            this.renderFileList();
        }
    }
    
    moveFileDown(index) {
        if (index < this.files.length - 1) {
            [this.files[index], this.files[index + 1]] = [this.files[index + 1], this.files[index]];
            this.renderFileList();
        }
    }
    
    removeFile(fileId) {
        this.files = this.files.filter(f => f.id !== fileId);
        this.updateUI();
        
        if (this.files.length === 0) {
            this.resetTool();
        }
    }
    
    clearAllFiles() {
        this.files = [];
        this.updateUI();
        this.resetTool();
    }
    
    async mergePDFs() {
        if (this.files.length < 2) {
            this.showToast('Please select at least 2 PDF files to merge', 'warning');
            return;
        }
        
        // Show processing UI
        this.fileList.style.display = 'none';
        this.processingSection.style.display = 'block';
        
        try {
            // Simulate processing with progress
            await this.simulateProcessing();
            
            // In a real implementation, this would call the API
            const result = await this.callMergeAPI();
            
            // Show results
            this.showResults(result);
            
            this.trackEvent('pdf_merged', {
                file_count: this.files.length,
                total_size: this.files.reduce((sum, f) => sum + f.sizeBytes, 0)
            });
            
        } catch (error) {
            console.error('Merge error:', error);
            this.showToast('Failed to merge PDFs. Please try again.', 'error');
            this.resetProcessing();
        }
    }
    
    async simulateProcessing() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    resolve();
                }
                this.progressBar.style.width = `${progress}%`;
            }, 200);
        });
    }
    
    async callMergeAPI() {
        // This would be replaced with actual API call
        const formData = new FormData();
        this.files.forEach((fileObj, index) => {
            formData.append(`file_${index}`, fileObj.file);
        });
        
        // Simulate API response
        return {
            filename: 'merged-document.pdf',
            size: this.formatFileSize(this.files.reduce((sum, f) => sum + f.sizeBytes, 0)),
            downloadUrl: '#' // Would be actual download URL
        };
    }
    
    showResults(result) {
        this.processingSection.style.display = 'none';
        this.resultsSection.style.display = 'block';
        
        document.getElementById('resultFileName').textContent = result.filename;
        document.getElementById('resultFileSize').textContent = result.size;
        
        // Store download URL for later use
        this.downloadUrl = result.downloadUrl;
    }
    
    downloadResult() {
        if (this.downloadUrl) {
            // In real implementation, this would trigger the download
            this.showToast('Download would start here', 'info');
            this.trackEvent('file_downloaded', {
                tool: 'merge_pdf'
            });
        }
    }
    
    resetTool() {
        this.files = [];
        this.fileList.style.display = 'none';
        this.processingSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.progressBar.style.width = '0%';
        this.downloadUrl = null;
    }
    
    resetProcessing() {
        this.processingSection.style.display = 'none';
        this.fileList.style.display = 'block';
        this.progressBar.style.width = '0%';
    }
    
    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showToast(message, type = 'info') {
        // Use the global toast function from main.js
        if (window.SnackPDF && window.SnackPDF.showToast) {
            window.SnackPDF.showToast(message, type);
        } else {
            alert(message); // Fallback
        }
    }
    
    trackEvent(eventName, properties = {}) {
        // Use the global tracking function from main.js
        if (window.SnackPDF && window.SnackPDF.trackEvent) {
            window.SnackPDF.trackEvent(eventName, {
                ...properties,
                tool: 'merge_pdf',
                platform: 'snackpdf'
            });
        }
    }
}

// Initialize the tool when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.mergeTool = new MergePDFTool();
});

// Export for use in other scripts
window.MergePDFTool = MergePDFTool;
