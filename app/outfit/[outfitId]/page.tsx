import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import FeedbackRequestButton from "./feedback-request-button";
import FeedbackThreads from "./feedback-threads";
import AIFeedbackSection from './ai-feedback-section';

export const generateMetadata = async ({
  params,
}: {
  params: { outfitId: string };
}): Promise<Metadata> => {
  return {
    title: "Outfit Details - Sister Chat",
    description: "View outfit details and feedback",
  };
};

// Define the Outfit type based on our database schema
interface Outfit {
  id: string;
  user_id: string;
  image_url: string;
  notes?: string;
  feedback_status: string;
  initial_ai_analysis?: {
    description: string;
    items: string[];
    colors: string[];
    occasion: string;
    style_score: number;
    suggestions: string[];
  };
  created_at: string;
}

export default async function OutfitPage({
  params,
}: {
  params: { outfitId: string };
}) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return notFound();
  }
  
  // Fetch the outfit details
  const { data: outfit, error } = await supabase
    .from('outfits')
    .select('*')
    .eq('id', params.outfitId)
    .eq('user_id', user.id)
    .single();
  
  if (error || !outfit) {
    return notFound();
  }
  
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Your Outfit</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Outfit Image and Notes */}
        <div>
          <div className="rounded-lg overflow-hidden mb-6 bg-gray-100 aspect-square relative">
            <img
              src={outfit.image_url}
              alt="Your outfit"
              className="object-cover w-full h-full"
            />
          </div>
          
          {outfit.notes && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Your Notes</h2>
              <p className="text-gray-700">{outfit.notes}</p>
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            Uploaded on {new Date(outfit.created_at).toLocaleDateString()}
          </div>
        </div>
        
        {/* AI Feedback and Friend Feedback Sections */}
        <div className="space-y-8">
          {/* AI Feedback Section */}
          <AIFeedbackSection 
            outfit={outfit as Outfit} 
          />
          
          {/* Friend Feedback Request Button */}
          {outfit.feedback_status === 'initial_ai_complete' && (
            <FeedbackRequestButton outfitId={params.outfitId} />
          )}
          
          {/* Friend Feedback Display */}
          {outfit.feedback_status === 'awaiting_friend_feedback' && (
            <FeedbackThreads outfitId={params.outfitId} />
          )}
        </div>
      </div>
    </div>
  );
} 