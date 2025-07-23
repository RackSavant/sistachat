'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Wifi, 
  WifiOff, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Battery,
  Camera,
  MapPin,
  Sun
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

// Types for Mentra photos
interface MentraPhoto {
  id: string;
  user_id: string;
  image_url: string;
  feedback: string;
  created_at: string;
  metadata?: {
    location?: string;
    brightness?: number;
    orientation?: {
      x: number;
      y: number;
      z: number;
    };
  };
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'streaming' | 'error';

export default function MentraLivePage() {
  const [user, setUser] = useState<User | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isStreaming, setIsStreaming] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Real photo data
  const [latestPhoto, setLatestPhoto] = useState<MentraPhoto | null>(null);
  const [recentPhotos, setRecentPhotos] = useState<MentraPhoto[]>([]);
  const [lastPhotoTime, setLastPhotoTime] = useState<Date | null>(null);

  const supabase = createClient();

  // Check authentication
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        redirect('/sign-in');
      }
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  // Fetch latest Mentra photos
  const fetchLatestPhotos = async () => {
    if (!user) return;

    try {
      const { data: photos, error } = await supabase
        .from('mentra_chat_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching photos:', error);
        return;
      }

      if (photos && photos.length > 0) {
        setLatestPhoto(photos[0]);
        setRecentPhotos(photos);
        setLastPhotoTime(new Date(photos[0].created_at));
        
        // If we have a recent photo (within last 5 minutes), consider glasses "connected"
        const photoAge = Date.now() - new Date(photos[0].created_at).getTime();
        const isRecentPhoto = photoAge < 5 * 60 * 1000; // 5 minutes
        
        if (isRecentPhoto && connectionStatus === 'disconnected') {
          setConnectionStatus('connected');
          setBatteryLevel(Math.floor(Math.random() * 40) + 60); // Simulate 60-100% battery
        }
      }
    } catch (err) {
      console.error('Error in fetchLatestPhotos:', err);
    }
  };

  // Poll for new photos every 3 seconds
  useEffect(() => {
    if (!user) return;

    fetchLatestPhotos(); // Initial fetch
    
    const interval = setInterval(fetchLatestPhotos, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Real-time subscription to new photos
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('mentra-live-photos')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mentra_chat_photos',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log(' New Mentra photo in Live View:', payload.new);
          const newPhoto = payload.new as MentraPhoto;
          
          setLatestPhoto(newPhoto);
          setRecentPhotos(prev => [newPhoto, ...prev.slice(0, 9)]);
          setLastPhotoTime(new Date(newPhoto.created_at));
          
          // Auto-connect when new photo arrives
          if (connectionStatus === 'disconnected') {
            setConnectionStatus('connected');
            setBatteryLevel(Math.floor(Math.random() * 40) + 60);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, connectionStatus]);

  const handleConnect = async () => {
    if (connectionStatus === 'connected' || connectionStatus === 'streaming') {
      // Disconnect
      setConnectionStatus('disconnected');
      setIsStreaming(false);
      setBatteryLevel(null);
      setError(null);
      return;
    }

    setError(null);
    setConnectionStatus('connecting');
    
    // Simulate connection process
    setTimeout(() => {
      if (latestPhoto) {
        setConnectionStatus('connected');
        setBatteryLevel(Math.floor(Math.random() * 40) + 60);
      } else {
        setConnectionStatus('error');
        setError('No recent photos found. Make sure your Mentra glasses are active and taking photos.');
      }
    }, 2000);
  };

  const handleStreaming = () => {
    if (connectionStatus !== 'connected' && connectionStatus !== 'streaming') return;
    
    if (isStreaming) {
      setIsStreaming(false);
      setConnectionStatus('connected');
    } else {
      setIsStreaming(true);
      setConnectionStatus('streaming');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'streaming': return 'bg-green-500 animate-pulse';
      case 'connecting': return 'bg-yellow-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'streaming': return 'Streaming';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  // Generate live metadata based on latest photo
  const getLiveMetadata = () => {
    if (!latestPhoto) {
      return {
        location: 'Unknown',
        brightness: 0,
        orientation: { x: 0, y: 0, z: 0 }
      };
    }

    // Use real metadata if available, otherwise simulate based on photo
    const metadata = latestPhoto.metadata || {};
    
    return {
      location: metadata.location || 'Living Room',
      brightness: metadata.brightness || Math.floor(Math.random() * 100),
      orientation: metadata.orientation || {
        x: Math.random() * 360,
        y: Math.random() * 360,
        z: Math.random() * 360
      }
    };
  };

  const liveData = getLiveMetadata();
  const timeSinceLastPhoto = lastPhotoTime ? 
    Math.floor((Date.now() - lastPhotoTime.getTime()) / 1000) : null;

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="hover-lift">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chat
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                Live View
              </h1>
              <p className="text-gray-600 dark:text-gray-300">MENTRA_LIVE_BT_CA4D</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium">{getStatusText()}</span>
            {batteryLevel && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Battery className="w-3 h-3" />
                {batteryLevel}%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="glass hover-lift">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Device Controls</h3>
                
                <div className="space-y-4">
                  <Button
                    onClick={handleConnect}
                    className={`w-full ${
                      connectionStatus === 'connected' || connectionStatus === 'streaming'
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-indigo-500 hover:bg-indigo-600'
                    }`}
                    disabled={connectionStatus === 'connecting'}
                  >
                    {connectionStatus === 'connecting' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Connecting...
                      </>
                    ) : connectionStatus === 'connected' || connectionStatus === 'streaming' ? (
                      <>
                        <WifiOff className="w-4 h-4 mr-2" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4 mr-2" />
                        Connect Glasses
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleStreaming}
                    variant="outline"
                    className="w-full"
                    disabled={connectionStatus !== 'connected' && connectionStatus !== 'streaming'}
                  >
                    {isStreaming ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    variant="outline"
                    className="w-full"
                    disabled={connectionStatus === 'disconnected'}
                  >
                    {audioEnabled ? (
                      <>
                        <VolumeX className="w-4 h-4 mr-2" />
                        Mute Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Enable Audio
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                {timeSinceLastPhoto !== null && (
                  <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Last photo: {timeSinceLastPhoto}s ago
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Live Metadata */}
            <Card className="glass hover-lift">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Live Data</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Location</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{liveData.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Brightness</span>
                    <div className="flex items-center gap-1">
                      <Sun className="w-3 h-3" />
                      <span>{liveData.brightness}%</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Orientation</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-mono">X</div>
                        <div>{liveData.orientation.x.toFixed(1)}°</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono">Y</div>
                        <div>{liveData.orientation.y.toFixed(1)}°</div>
                      </div>
                      <div className="text-center">
                        <div className="font-mono">Z</div>
                        <div>{liveData.orientation.z.toFixed(1)}°</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3">
            <Card className="glass hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Live Feed</h3>
                  {isStreaming && (
                    <Badge variant="default" className="bg-green-500 animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full mr-2" />
                      LIVE
                    </Badge>
                  )}
                </div>

                {/* Video Feed Area */}
                <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {latestPhoto && (connectionStatus === 'streaming' || connectionStatus === 'connected') ? (
                    <>
                      <img
                        src={latestPhoto.image_url}
                        alt="Live feed from Mentra glasses"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Live Overlay */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Camera className="w-4 h-4" />
                            <span className="font-medium">MENTRA_LIVE_BT_CA4D</span>
                          </div>
                          <div className="text-xs opacity-90">
                            {new Date().toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-xs">
                          <div> 📍 {liveData.location}</div>
                          <div> ☀️ {liveData.brightness}% brightness</div>
                        </div>
                      </div>

                      {/* Bottom Status */}
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-xs">
                          <div>Latest photo taken</div>
                          <div className="font-medium">
                            {lastPhotoTime?.toLocaleString()}
                          </div>
                        </div>
                        
                        {isStreaming && (
                          <div className="bg-green-500/90 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            STREAMING
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Camera className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">
                          {connectionStatus === 'disconnected' ? 'Connect Your Glasses' : 'Waiting for Feed...'}
                        </h3>
                        <p className="text-gray-300">
                          {connectionStatus === 'disconnected' 
                            ? 'Click "Connect Glasses" to start viewing your live feed'
                            : 'Take a photo with your Mentra glasses to see it here'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Feedback */}
                {latestPhoto?.feedback && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg">
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                      <span className="text-pink-500">✨</span>
                      AI Fashion Sister Says:
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200">
                      {latestPhoto.feedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Photos Grid */}
            {recentPhotos.length > 1 && (
              <Card className="glass hover-lift mt-6">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Recent Photos</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {recentPhotos.slice(1, 9).map((photo) => (
                      <div key={photo.id} className="relative group cursor-pointer">
                        <img
                          src={photo.image_url}
                          alt="Recent photo from Mentra glasses"
                          className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
                          onClick={() => setLatestPhoto(photo)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                        <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                          {new Date(photo.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
