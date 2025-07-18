# 👗 AI Fashion Sister x Mentra OS Integration

Transform your smart glasses into a personal fashion assistant! This integration connects your Mentra OS smart glasses with the AI Fashion Sister VAPI assistant for real-time outfit analysis and styling advice.

## 🎯 What This Does

1. **Take photos** with your Mentra OS smart glasses
2. **Automatically upload** to your Supabase storage
3. **Trigger AI Fashion Sister** VAPI assistant
4. **Get voice feedback** on your phone with styling advice
5. **View photos** and status through web interface

## 🚀 Setup Instructions

### 1. Prerequisites

- **Mentra OS** installed on your smart glasses
- **VAPI account** with AI Fashion Sister assistant (already created: `f7dfb141-98ff-4e33-b24d-c88220fd792f`)
- **Supabase** project with storage and database
- **Node.js** 18+ and **npm/yarn**

### 2. Create Mentra OS App

1. **Navigate to** [console.mentra.glass](https://console.mentra.glass)
2. **Sign in** with your Mentra OS account
3. **Click "Create App"**
4. **Set package name:** `com.yourname.aifashionsister`
5. **Set public URL:** Your ngrok URL (e.g., `https://your-ngrok-url.ngrok.io`)
6. **Add permissions:** Camera, Microphone
7. **Save** your app and copy the API key

### 3. Install Dependencies

Create a new directory for your Mentra app:

```bash
mkdir ai-fashion-sister-mentra
cd ai-fashion-sister-mentra
```

Copy the files from this project:
- `mentra-integration.ts` (main app file)
- `mentra-package.json` → `package.json`
- `mentra-env.example` → `.env.example`
- `views/fashion-sister-viewer.ejs`

Install dependencies:
```bash
npm install
```

### 4. Configuration

Copy the environment example:
```bash
cp .env.example .env
```

Update `.env` with your values:
```env
# Mentra OS Configuration
PACKAGE_NAME=com.yourname.aifashionsister
MENTRAOS_API_KEY=your_mentra_api_key_from_console
PORT=3000

# Supabase Configuration (from your main project)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# VAPI Configuration (already set up)
VAPI_API_KEY=c10a907b-8e5c-4cf2-bd05-ac66722ffaa9
VAPI_ASSISTANT_ID=f7dfb141-98ff-4e33-b24d-c88220fd792f

# Your phone number for VAPI calls
MENTRA_CALLBACK_NUMBER=+1234567890
```

### 5. Set Up Supabase

Run the migration in your main project:
```bash
npx supabase db reset
```

This will create the `mentra_interactions` table.

### 6. Run the Integration

Start the development server:
```bash
npm run dev
```

Set up ngrok to expose your local server:
```bash
ngrok http 3000 --url=your-static-ngrok-url
```

### 7. Test the Integration

1. **Install the app** on your Mentra OS glasses
2. **Launch the app** from your glasses
3. **Press the button** to take a photo
4. **Wait for processing** message
5. **Check your phone** for VAPI call with AI Fashion Sister feedback!

## 🎮 How to Use

### Button Controls

- **Short Press:** Take a single photo for outfit analysis
- **Long Press:** Toggle streaming mode for continuous feedback

### Streaming Mode

When enabled, the app will continuously take photos and send them to the AI Fashion Sister for analysis. Perfect for trying on multiple outfits!

### Web Interface

Visit `/webview` on your Mentra app to see:
- Latest photo taken
- Processing status
- VAPI call status
- Instructions and controls

## 🔧 Customization

### Update Phone Number

Edit the `triggerVAPIAssistant` method in `mentra-integration.ts` to customize the phone number per user:

```typescript
// You can customize this per user
customer: {
  number: process.env.MENTRA_CALLBACK_NUMBER || '+1234567890'
}
```

### Modify AI Sister Prompt

Update the VAPI assistant system prompt to customize the fashion advice style:

```bash
curl -X PATCH "https://api.vapi.ai/assistant/f7dfb141-98ff-4e33-b24d-c88220fd792f" \
  -H "Authorization: Bearer c10a907b-8e5c-4cf2-bd05-ac66722ffaa9" \
  -H "Content-Type: application/json" \
  -d '{
    "model": {
      "messages": [
        {
          "role": "system",
          "content": "Your custom fashion sister prompt..."
        }
      ]
    }
  }'
```

### Add User Authentication

To associate Mentra users with your app users, modify the `onSession` method to handle user mapping:

```typescript
// Map Mentra userId to your app's user system
const appUserId = await mapMentraUserToAppUser(userId);
```

## 🚨 Troubleshooting

### Common Issues

1. **"Package name mismatch"**
   - Ensure `PACKAGE_NAME` in `.env` matches your Mentra console

2. **"VAPI call failed"**
   - Check your `VAPI_API_KEY` and `VAPI_ASSISTANT_ID`
   - Verify your phone number format (`+1234567890`)

3. **"Image upload failed"**
   - Check Supabase storage permissions
   - Ensure `raw-images` bucket exists
   - Verify `SUPABASE_SERVICE_ROLE_KEY`

4. **"Database insert failed"**
   - Run the migration: `npx supabase db reset`
   - Check RLS policies on `mentra_interactions` table

### Debug Mode

Enable verbose logging by adding to your app:

```typescript
// Add to constructor
this.logger.setLevel('debug');
```

### Test Without Glasses

You can test the integration without glasses by simulating photo data:

```typescript
// Add test route
app.get('/test-photo', async (req, res) => {
  const testPhoto = {
    requestId: 'test-123',
    buffer: Buffer.from('test-image-data'),
    timestamp: new Date(),
    mimeType: 'image/jpeg',
    filename: 'test.jpg',
    size: 1024
  };
  
  await this.cachePhotoAndAnalyze(testPhoto, 'test-user', session);
  res.json({ success: true });
});
```

## 📱 Next Steps

1. **Deploy to production** with a proper hosting service
2. **Add user authentication** to map Mentra users to your app
3. **Implement user preferences** for personalized styling advice
4. **Add outfit history** and tracking features
5. **Create outfit recommendations** based on past feedback

## 🔥 Features

- ✅ Real-time photo capture from smart glasses
- ✅ Automatic image upload to Supabase
- ✅ AI Fashion Sister voice feedback via VAPI
- ✅ Web interface for photo viewing
- ✅ Streaming mode for continuous analysis
- ✅ Database tracking of all interactions
- ✅ Error handling and status updates

## 🎉 You're Ready!

Your AI Fashion Sister is now integrated with Mentra OS! Take photos with your smart glasses and get instant fashion feedback through voice calls. Perfect for getting styling advice while getting dressed or shopping!

---

**Need help?** Check the troubleshooting section or reach out for support. 