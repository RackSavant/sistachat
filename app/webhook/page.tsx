import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function WebhookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Extract Mentra OS tokens from query parameters
  const params = await searchParams;
  const aosTemptToken = params.aos_temp_token;
  const aosSignedUserToken = params.aos_signed_user_token;

  console.log('🔵 Webhook webview accessed with tokens:', {
    hasAosTemptToken: !!aosTemptToken,
    hasAosSignedUserToken: !!aosSignedUserToken,
  });

  // Get recent photos from the database
  const supabase = await createClient();
  const defaultUserId = process.env.MENTRA_DEFAULT_USER_ID;

  let recentPhotos = [];
  if (defaultUserId) {
    const { data: interactions } = await supabase
      .from('mentra_interactions')
      .select('*')
      .eq('user_id', defaultUserId)
      .eq('interaction_type', 'glasses_photo')
      .order('timestamp', { ascending: false })
      .limit(10);

    recentPhotos = interactions || [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-4">
            👗 SistaChat Fashion AI 📸
          </h1>
          <p className="text-gray-600 text-lg">
            Your smart glasses fashion advisor powered by AI
          </p>
        </div>

        {recentPhotos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              Ready for your first photo!
            </h2>
            <p className="text-gray-600 mb-6">
              Press the right button on your glasses to capture an outfit photo and get instant AI fashion advice.
            </p>
            <div className="bg-white rounded-lg p-6 shadow-lg max-w-md mx-auto">
              <h3 className="font-bold text-lg mb-3">How it works:</h3>
              <ol className="text-left space-y-2">
                <li>1. 📸 Press right button to take photo</li>
                <li>2. 🤖 AI analyzes your outfit</li>
                <li>3. 🔊 Hear fashion advice through speakers</li>
                <li>4. 👀 View photo and feedback here</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              📸 Your Recent Fashion Shots
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentPhotos.map((photo, index) => (
                <div key={photo.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="aspect-square relative">
                    <Image
                      src={photo.image_url}
                      alt="Outfit photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(photo.timestamp).toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-purple-600 mb-2">
                      AI Fashion Advice:
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {photo.ai_response}
                    </p>
                    {photo.audio_url && (
                      <div className="mt-3">
                        <audio controls className="w-full">
                          <source src={photo.audio_url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12 text-gray-500">
          <p>Powered by OpenAI Vision + TTS • Connected via Mentra OS</p>
        </div>
      </div>
    </div>
  );
} 