# 🔥 Mentra OS Integration Setup Guide

This guide will help you fix the "no settings available for this app" issue and properly integrate your SistaChat application with Mentra OS glasses.

## 📋 Quick Setup Steps

### 1. Configure Your Mentra OS App

1. Go to [console.mentra.glass](https://console.mentra.glass)
2. Sign in with your Mentra OS account
3. Find your existing app or create a new one
4. Make sure these settings are configured:
   - **Package name**: `com.aifashionsister.mentra` (or your custom package name)
   - **Public URL**: Your ngrok URL (e.g., `https://your-ngrok-url.ngrok.io`)
   - **Permissions**: Camera, Microphone
5. Save your app and copy the API key

### 2. Update Environment Variables

1. Edit the `.env.mentra` file with your actual values:
   ```
   PACKAGE_NAME=your_package_name_from_console
   MENTRAOS_API_KEY=your_api_key_from_console
   MENTRA_CALLBACK_NUMBER=your_actual_phone_number
   ```

2. Make sure your Supabase credentials are correct:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
   ```

### 3. Run the Integration Server

1. In one terminal, start your main SistaChat application:
   ```bash
   npm run dev -- -p 3000
   ```

2. In another terminal, run the Mentra integration server:
   ```bash
   ./run-mentra-integration.sh
   ```

### 4. Expose Your Local Server with ngrok

1. Install ngrok if you haven't already:
   ```bash
   npm install -g ngrok
   ```

2. Start ngrok to expose your Mentra integration server:
   ```bash
   ngrok http 3001
   ```

3. Copy the HTTPS URL provided by ngrok (e.g., `https://abc123.ngrok.io`)

### 5. Update Your Mentra OS App URL

1. Go back to [console.mentra.glass](https://console.mentra.glass)
2. Edit your app
3. Update the **Public URL** field with your ngrok URL
4. Save changes

## 🧪 Testing the Integration

1. Launch your app on the Mentra OS glasses
2. You should now see the AI Fashion Sister interface
3. Press the button on your glasses to take a photo
4. The photo will be uploaded to your Supabase storage
5. The AI Fashion Sister will analyze the photo and call your phone with styling advice
6. You can also tap the "Open SistaChat Interface" button to view the chat interface

## 🚨 Troubleshooting

### "No settings available for this app" Error
- Make sure your ngrok URL is correctly set in the Mentra console
- Verify that the Mentra integration server is running
- Check that the package name in `.env.mentra` matches exactly what's in the console

### Photo Upload Issues
- Check your Supabase storage permissions
- Ensure the `raw-images` bucket exists
- Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct

### VAPI Call Not Working
- Verify your phone number format in `.env.mentra` (should be `+1234567890`)
- Check that the VAPI API key and Assistant ID are correct

## 🔄 Integration Flow

1. User presses button on Mentra OS glasses
2. Photo is taken and uploaded to Supabase storage
3. AI Fashion Sister is triggered via VAPI
4. User receives a phone call with styling advice
5. Photo and analysis are available in the SistaChat interface

## 📱 Next Steps

Once the basic integration is working, you can:
1. Customize the AI Fashion Sister prompts
2. Add user authentication to map Mentra users to your app users
3. Implement user preferences for personalized styling advice
4. Add outfit history and tracking features

---

**Need help?** If you're still experiencing issues, check the logs of both your SistaChat app and the Mentra integration server for more details.
