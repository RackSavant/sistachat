"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/utils/supabase/client";
import { uploadOutfit } from "../actions";
import MultiPhotoUpload from "@/components/ui/multi-photo-upload";
import { CheckCircle, Sparkles } from "lucide-react";

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  url?: string;
  storagePath?: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function UploadForm({ userId }: { userId: string }) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [completedOutfitIds, setCompletedOutfitIds] = useState<string[]>([]);
  const [shouldTokenize, setShouldTokenize] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    setUploadError(null);
  };

  const handleUploadComplete = (files: UploadedFile[]) => {
    console.log('🎉 All uploads complete:', files);
    // Files are already uploaded to storage, now we just need to create outfit records
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const successfulFiles = uploadedFiles.filter(f => f.status === 'success');
    
    console.log('🚀 Form submitted!', { successfulFiles: successfulFiles.length, userId });
    
    if (successfulFiles.length === 0) {
      console.log('❌ No successful uploads');
      setUploadError("Please upload at least one image successfully");
      return;
    }

    console.log('📤 Creating outfit records for uploaded images...');
    setIsProcessing(true);
    setUploadError(null);

    try {
      const outfitIds: string[] = [];
      
      // Create outfit records for each successfully uploaded file
      for (const file of successfulFiles) {
        if (!file.url || !file.storagePath) continue;
        
        console.log(`💾 Creating outfit record for ${file.file.name}...`);
        const { outfitId, error } = await uploadOutfit({
          userId,
          imageUrl: file.url,
          storagePath: file.storagePath,
          notes,
        });

        if (error) {
          console.error(`❌ Error creating outfit for ${file.file.name}:`, error);
          // Continue with other files instead of failing completely
        } else if (outfitId) {
          outfitIds.push(outfitId);
          console.log(`✅ Outfit record created for ${file.file.name}:`, outfitId);
        }
      }

      if (outfitIds.length > 0) {
        setCompletedOutfitIds(outfitIds);
        setIsComplete(true);
        console.log(`🎉 ${outfitIds.length} outfit(s) created successfully!`);
      } else {
        throw new Error('Failed to create outfit records');
      }
      
    } catch (error) {
      console.error("💥 Processing error:", error);
      setUploadError(error instanceof Error ? error.message : "Error processing uploads");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setUploadedFiles([]);
    setNotes("");
    setUploadError(null);
    setIsComplete(false);
    setCompletedOutfitIds([]);
  };

  const viewOutfits = () => {
    if (completedOutfitIds.length === 1) {
      router.push(`/outfit/${completedOutfitIds[0]}`);
    } else {
      // If multiple outfits, go to dashboard or outfit list
      router.push('/dashboard');
    }
  };

  // Show success state if upload is complete
  if (isComplete) {
    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center justify-center mx-auto animate-glow">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Photos Uploaded Successfully! ✨
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {completedOutfitIds.length} outfit{completedOutfitIds.length !== 1 ? 's' : ''} created and ready for AI analysis
            </p>
          </div>
        </div>

        {/* Success Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={viewOutfits}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white btn-interactive hover-lift animate-glow"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            View {completedOutfitIds.length === 1 ? 'Outfit' : 'Outfits'}
          </Button>
          {shouldTokenize && (
            <Button 
              onClick={() => {
                if (completedOutfitIds.length === 1) {
                  router.push(`/outfit/${completedOutfitIds[0]}?tokenize=1`);
                } else {
                  router.push('/settings/solana');
                }
              }}
              variant="outline"
              className="glass-pink hover-lift"
            >
              Tokenize On-Chain
            </Button>
          )}
          <Button 
            onClick={resetForm}
            variant="outline"
            className="glass-pink hover-lift"
          >
            Upload More Photos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Multi-Photo Upload Component */}
      <MultiPhotoUpload
        userId={userId}
        supabase={supabase}
        maxFiles={3}
        maxSizeBytes={5 * 1024 * 1024} // 5MB
        onFilesChange={handleFilesChange}
        onUploadComplete={handleUploadComplete}
      />

      {/* Success/Error Display */}
      {uploadError && (
        <div className={`p-3 rounded-lg ${
          uploadError.includes('Failed to create outfit records')
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              uploadError.includes('Failed to create outfit records')
                ? 'bg-green-500 animate-pulse'
                : 'bg-orange-500 animate-pulse'
            }`}></div>
            <p className={`text-sm ${
              uploadError.includes('Failed to create outfit records')
                ? 'text-green-700 dark:text-green-300'
                : 'text-orange-700 dark:text-orange-300'
            }`}>
              {uploadError.includes('Failed to create outfit records') 
                ? 'Thank you we will generate an image and be in touch!' 
                : uploadError
              }
            </p>
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add notes about these outfits, occasions, or specific questions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="glass border-none focus:ring-2 focus:ring-pink-400"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Include details like the occasion, your concerns, or specific feedback you're looking for
        </p>
      </div>

      {/* Tokenize Choice (shown after at least one file selected) */}
      {uploadedFiles.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200/60 dark:border-purple-800/40">
          <Checkbox
            id="tokenize"
            checked={shouldTokenize}
            onCheckedChange={(v) => setShouldTokenize(!!v)}
          />
          <div className="space-y-1">
            <Label htmlFor="tokenize" className="text-sm font-medium">Also tokenize on-chain after upload?</Label>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              If checked, you'll be prompted to mint an NFT for your uploaded item using your connected Solana wallet.
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        className={`w-full btn-interactive hover-lift animate-glow ${
          uploadError && !uploadError.includes('Failed to create outfit records')
            ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600" 
            : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        } text-white`}
        disabled={isProcessing || uploadedFiles.filter(f => f.status === 'success').length === 0}
      >
        {isProcessing 
          ? (shouldTokenize ? "Uploading & Preparing Tokenization..." : "Generating...") 
          : uploadError && !uploadError.includes('Failed to create outfit records')
            ? "Upload Again!" 
            : `Create ${uploadedFiles.filter(f => f.status === 'success').length} Outfit${uploadedFiles.filter(f => f.status === 'success').length !== 1 ? 's' : ''}`
        }
      </Button>
    </form>
  );
} 