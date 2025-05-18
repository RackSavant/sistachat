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

// Add the missing textarea component
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    variant?: "default" | "error";
  }
>(({ className, variant, ...props }, ref) => {
  return (
    <textarea
      className={cn(textareaVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

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
      const filePath = `outfit-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("outfit-images")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from("outfit-images")
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
        <Label htmlFor="outfit-image">Outfit Image</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-4">
          {filePreview ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden max-h-[400px] flex items-center justify-center bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={filePreview}
                  alt="Upload preview"
                  className="max-h-[400px] max-w-full object-contain"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Remove
                </Button>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="flex flex-col items-center justify-center cursor-pointer py-8"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <p className="text-muted-foreground text-sm mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-muted-foreground text-xs">
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
          <p className="text-sm text-destructive">{uploadError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add notes about this outfit, occasion, or specific questions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Include details like the occasion, your concerns, or specific feedback you're looking for
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isUploading || !file}>
        {isUploading ? "Uploading..." : "Upload Outfit"}
      </Button>
    </form>
  );
} 