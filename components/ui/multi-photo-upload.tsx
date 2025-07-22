"use client";

import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, Camera, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { uploadImage } from "@/utils/supabase/storage";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  storagePath?: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  progress?: number;
}

interface MultiPhotoUploadProps {
  userId: string;
  supabase: any;
  maxFiles?: number;
  maxSizeBytes?: number;
  onFilesChange?: (files: UploadedFile[]) => void;
  onUploadComplete?: (files: UploadedFile[]) => void;
}

export default function MultiPhotoUpload({
  userId,
  supabase,
  maxFiles = 3,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  onFilesChange,
  onUploadComplete
}: MultiPhotoUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = uploadedFiles.length < maxFiles;
  const successfulUploads = uploadedFiles.filter(f => f.status === 'success');

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeBytes) {
      return `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds ${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB limit`;
    }
    if (!file.type.startsWith('image/')) {
      return 'Only image files are allowed';
    }
    return null;
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    try {
      console.log(`📤 Starting upload for ${uploadedFile.file.name}`);
      
      const uploadResult = await uploadImage(uploadedFile.file, userId, supabase, {
        bucket: 'raw-images',
        maxSizeBytes,
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        generateUniqueName: true
      });

      if (uploadResult.success) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'success', url: uploadResult.url, storagePath: uploadResult.path }
            : f
        ));
        console.log(`✅ Upload successful for ${uploadedFile.file.name}`);
      } else {
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'error', error: uploadResult.error }
            : f
        ));
        console.error(`❌ Upload failed for ${uploadedFile.file.name}:`, uploadResult.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));
      console.error(`💥 Upload error for ${uploadedFile.file.name}:`, error);
    }
  };

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const availableSlots = maxFiles - uploadedFiles.length;
    const filesToAdd = fileArray.slice(0, availableSlots);
    
    setGlobalError(null);

    if (fileArray.length > availableSlots) {
      setGlobalError(`Only ${availableSlots} more photo${availableSlots !== 1 ? 's' : ''} can be added (${maxFiles} max)`);
    }

    const newFiles: UploadedFile[] = [];

    for (const file of filesToAdd) {
      const validationError = validateFile(file);
      if (validationError) {
        setGlobalError(validationError);
        continue;
      }

      // Check for duplicates
      const isDuplicate = uploadedFiles.some(uf => 
        uf.file.name === file.name && uf.file.size === file.size
      );
      if (isDuplicate) {
        setGlobalError(`"${file.name}" has already been uploaded`);
        continue;
      }

      const uploadedFile: UploadedFile = {
        id: generateFileId(),
        file,
        preview: URL.createObjectURL(file),
        status: 'uploading'
      };

      newFiles.push(uploadedFile);
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => {
        const updated = [...prev, ...newFiles];
        onFilesChange?.(updated);
        return updated;
      });

      // Start uploads
      newFiles.forEach(uploadFile);
    }
  }, [uploadedFiles, maxFiles, userId, supabase, maxSizeBytes, onFilesChange]);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      const updated = prev.filter(f => f.id !== fileId);
      onFilesChange?.(updated);
      return updated;
    });
    setGlobalError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (canAddMore && e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && canAddMore) {
      addFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Check if all uploads are complete
  React.useEffect(() => {
    const allComplete = uploadedFiles.length > 0 && 
                      uploadedFiles.every(f => f.status === 'success' || f.status === 'error');
    const hasSuccess = uploadedFiles.some(f => f.status === 'success');
    
    if (allComplete && hasSuccess) {
      onUploadComplete?.(uploadedFiles);
    }
  }, [uploadedFiles, onUploadComplete]);

  return (
    <div className="space-y-6">
      {/* Upload Counter */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Photos</Label>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {successfulUploads.length} / {maxFiles} uploaded
        </span>
      </div>

      {/* Upload Zone */}
      {canAddMore && (
        <div
          className={`glass border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer hover-lift ${
            isDragOver 
              ? 'border-pink-400 bg-pink-50/50 dark:bg-pink-900/20' 
              : 'border-pink-300 dark:border-pink-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center mb-4 animate-glow">
              {uploadedFiles.length === 0 ? <Camera className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
              {uploadedFiles.length === 0 
                ? "Drop your photos here or click to browse! 📸"
                : `Add ${maxFiles - uploadedFiles.length} more photo${maxFiles - uploadedFiles.length !== 1 ? 's' : ''}`
              }
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              JPG, PNG, WebP or GIF (max. {(maxSizeBytes / 1024 / 1024).toFixed(1)}MB each)
            </p>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Global Error */}
      {globalError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{globalError}</p>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Attached Photos ({uploadedFiles.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((uploadedFile) => (
              <div key={uploadedFile.id} className="glass rounded-lg p-4 hover-lift">
                {/* Image Preview */}
                <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800">
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {uploadedFile.status === 'uploading' && (
                      <div className="bg-black/50 rounded-full p-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                    {uploadedFile.status === 'success' && (
                      <div className="bg-green-500 rounded-full p-2 opacity-90">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                    {uploadedFile.status === 'error' && (
                      <div className="bg-red-500 rounded-full p-2 opacity-90">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* File Info */}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  
                  {/* Status Text */}
                  {uploadedFile.status === 'uploading' && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">Uploading...</p>
                  )}
                  {uploadedFile.status === 'success' && (
                    <p className="text-xs text-green-600 dark:text-green-400">✅ Uploaded successfully!</p>
                  )}
                  {uploadedFile.status === 'error' && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      ❌ {uploadedFile.error || 'Upload failed'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Limit Reached */}
      {!canAddMore && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">
            Maximum photos uploaded ({maxFiles}/{maxFiles})
          </p>
        </div>
      )}
    </div>
  );
}
