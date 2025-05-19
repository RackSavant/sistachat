'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
}

interface UsageQuota {
  id: string;
  user_id: string;
  month_year_key: string;
  images_uploaded_count: number;
  feedback_flows_initiated_count: number;
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageQuota, setUsageQuota] = useState<UsageQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchSubscriptionData();
  }, []);
  
  const fetchSubscriptionData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Fetch subscription data
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .single();
      
      if (subError && subError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected for free users
        throw subError;
      }
      
      if (subData) {
        setSubscription(subData);
      }
      
      // Fetch usage quota
      const currentDate = new Date();
      const monthYearKey = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, '0')}`;
      
      const { data: usageData, error: usageError } = await supabase
        .from('user_usage_quotas')
        .select('*')
        .eq('month_year_key', monthYearKey)
        .single();
      
      if (usageError && usageError.code !== 'PGRST116') {
        throw usageError;
      }
      
      if (usageData) {
        setUsageQuota(usageData);
      }
      
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Failed to load subscription information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Determine if the user has an active premium subscription
  const isPremium = subscription?.status === 'active' && 
                    subscription?.plan_id?.includes('premium');
  
  // Calculate limits based on subscription tier
  const imageUploadLimit = isPremium ? 100 : 3;
  const feedbackFlowsLimit = isPremium ? 50 : 0;
  
  // Calculate usage percentages
  const imageUploadPercentage = usageQuota 
    ? Math.min(100, (usageQuota.images_uploaded_count / imageUploadLimit) * 100) 
    : 0;
    
  const feedbackFlowsPercentage = usageQuota && feedbackFlowsLimit > 0
    ? Math.min(100, (usageQuota.feedback_flows_initiated_count / feedbackFlowsLimit) * 100)
    : 0;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">
            Loading subscription information...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-xl">Current Plan</CardTitle>
                  <CardDescription>
                    Your current subscription plan and status
                  </CardDescription>
                </div>
                <Badge className={isPremium ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                  {isPremium ? 'Premium' : 'Free Tier'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscription ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-sm font-medium">Status:</p>
                      <p className="text-sm capitalize">{subscription.status}</p>
                      
                      <p className="text-sm font-medium">Current Period:</p>
                      <p className="text-sm">
                        {formatDate(subscription.current_period_start)} to {formatDate(subscription.current_period_end)}
                      </p>
                      
                      <p className="text-sm font-medium">Plan ID:</p>
                      <p className="text-sm">{subscription.plan_id}</p>
                    </div>
                  </div>
                ) : (
                  <p>You are currently on the free tier.</p>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Image Uploads</span>
                        <span className="text-sm">
                          {usageQuota?.images_uploaded_count || 0} / {imageUploadLimit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${imageUploadPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Feedback Requests</span>
                        <span className="text-sm">
                          {usageQuota?.feedback_flows_initiated_count || 0} / {feedbackFlowsLimit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${feedbackFlowsLimit > 0 ? 'bg-primary' : 'bg-gray-400'}`}
                          style={{ width: `${feedbackFlowsPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-3">
              {!isPremium ? (
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button className="w-full">Upgrade to Premium</Button>
                </Link>
              ) : (
                <Button className="w-full sm:w-auto" disabled>
                  Manage Subscription
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {/* Plan Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className={!isPremium ? 'bg-card border-primary/50' : ''}>
              <CardHeader>
                <CardTitle>Free Tier</CardTitle>
                <CardDescription>Basic features for getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-6">$0 <span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>3 outfit uploads per month</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>AI feedback on all uploads</span>
                  </li>
                  <li className="flex items-center text-gray-400">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    <span>No SMS feedback requests</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className={isPremium ? 'border-primary bg-primary/5' : ''}>
              <CardHeader>
                <CardTitle>Premium</CardTitle>
                <CardDescription>Advanced features for fashion enthusiasts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-6">$20 <span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>100 outfit uploads per month</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>Advanced AI feedback on all uploads</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>50 SMS feedback requests per month</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    <span>Priority support</span>
                  </li>
                </ul>
              </CardContent>
              {!isPremium && (
                <CardFooter>
                  <Link href="/pricing" className="w-full">
                    <Button className="w-full">Upgrade Now</Button>
                  </Link>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 