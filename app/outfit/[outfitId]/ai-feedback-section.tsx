'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

export default function AIFeedbackSection({ outfit }: { outfit: Outfit }) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(outfit.initial_ai_analysis);
  
  // If the outfit is in 'pending_initial_ai' status, trigger the analysis
  useEffect(() => {
    const triggerAnalysis = async () => {
      if (outfit.feedback_status === 'pending_initial_ai' && !isLoading && !analysis) {
        setIsLoading(true);
        try {
          const response = await fetch('/api/image-analysis', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ outfitId: outfit.id }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to analyze image');
          }
          
          const data = await response.json();
          setAnalysis(data.analysis);
        } catch (error) {
          console.error('Error analyzing image:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    triggerAnalysis();
  }, [outfit.id, outfit.feedback_status, isLoading, analysis]);
  
  const handleRetryAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/image-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ outfitId: outfit.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">AI Stylist Feedback</CardTitle>
        <Badge variant={isLoading ? 'secondary' : 'default'}>
          {isLoading ? 'Analyzing...' : 'Analysis Complete'}
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">
              AI is analyzing your outfit...
            </p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-700">{analysis.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Items</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {analysis.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Colors</h3>
                <div className="flex gap-2">
                  {analysis.colors.map((color, index) => (
                    <span 
                      key={index} 
                      className="inline-block px-3 py-1 rounded-full text-sm bg-gray-100"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Occasion</h3>
              <p className="text-gray-700">{analysis.occasion}</p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Style Score</h3>
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-2">{analysis.style_score}/10</span>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${analysis.style_score * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Suggestions</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              Unable to analyze your outfit. Please try again.
            </p>
            <Button 
              onClick={handleRetryAnalysis} 
              disabled={isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Retry Analysis'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 