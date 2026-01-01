import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseFileUploadOptions {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    onSuccess?: (file: File, preview: string) => void;
    onError?: (error: string) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        onSuccess,
        onError
    } = options;

    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const validateFile = useCallback((file: File): string | null => {
        // MIME to Extension mapping for fallback
        const mimeToExt: Record<string, string[]> = {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/jpg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
        };

        const fileType = file.type;
        const fileName = file.name.toLowerCase();

        const isValidMime = allowedTypes.includes(fileType);

        // If MIME matches, good.
        // If MIME is empty/generic, check extension against allowed types.
        let isValidExt = false;
        if (!isValidMime && (!fileType || fileType === 'application/octet-stream')) {
            isValidExt = allowedTypes.some(allowedMime => {
                const extensions = mimeToExt[allowedMime] || [];
                return extensions.some(ext => fileName.endsWith(ext));
            });
        }

        if (!isValidMime && !isValidExt) {
            return `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
        }

        if (file.size > maxSize) {
            return `File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
        }
        return null;
    }, [allowedTypes, maxSize]);

    const handleFile = useCallback((file: File) => {
        const error = validateFile(file);
        if (error) {
            toast.error(error);
            onError?.(error);
            return;
        }

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        const preview = URL.createObjectURL(file);
        setFile(file);
        setPreviewUrl(preview);
        onSuccess?.(file, preview);
        toast.success('File uploaded successfully');
    }, [validateFile, previewUrl, onSuccess, onError]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFile(droppedFile);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const clearFile = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setFile(null);
        setPreviewUrl(null);
    }, [previewUrl]);

    return {
        file,
        previewUrl,
        isDragging,
        handleFile,
        handleDrop,
        handleDragOver,
        handleDragLeave,
        clearFile,
        setFile,
        setPreviewUrl
    };
};
