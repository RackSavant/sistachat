"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import { uploadOutfit } from "../actions";

export default function UploadForm({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setUploadError("File size exceeds 5MB limit");
        return;
      }

      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        setUploadError("Only image files are allowed");
        return;
      }

      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
      setUploadError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setUploadError("Please select an image to upload");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `outfits/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("outfits")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from("outfits")
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      // Create outfit record in database using server action
      const { outfitId, error } = await uploadOutfit({
        userId,
        imageUrl,
        storagePath: filePath,
        notes,
      });

      if (error) {
        throw new Error(error);
      }

      // Redirect to the outfit detail page
      router.push(`/outfit/${outfitId}`);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Unknown error occurred");
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setFilePreview(null);
    setNotes("");
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="outfit-image" className="text-sm font-medium">Outfit Image</Label>
        <div className="glass border-2 border-dashed border-pink-300 dark:border-pink-500 rounded-lg p-4 hover-lift transition-all">
          {filePreview ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden max-h-[400px] flex items-center justify-center bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={filePreview}
                  alt="Upload preview"
                  className="max-h-[400px] max-w-full object-contain hover-lift"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm} className="glass-pink hover-lift">
                  Remove
                </Button>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="glass-pink hover-lift">
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="flex flex-col items-center justify-center cursor-pointer py-12 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-colors rounded-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center mb-4 animate-glow hover-lift">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg font-medium mb-2">
                Click to upload your outfit pic! 📸
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                JPG, PNG or GIF (max. 5MB)
              </p>
            </div>
          )}
          <Input
            id="outfit-image"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {uploadError && (
          <p className="text-sm text-red-600 dark:text-red-400 animate-fade-in">{uploadError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add notes about this outfit, occasion, or specific questions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="glass border-none focus:ring-2 focus:ring-pink-400"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Include details like the occasion, your concerns, or specific feedback you're looking for
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white btn-interactive hover-lift animate-glow" 
        disabled={isUploading || !file}
      >
        {isUploading ? "Uploading..." : "Upload Outfit"}
      </Button>
    </form>
  );
} 