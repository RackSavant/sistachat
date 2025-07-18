# 🔥 Simple Mentra OS → AI Fashion Sister Integration

Get **instant outfit feedback** from your smart glasses! Take photos with Mentra OS and get voice styling advice from your AI Fashion Sister.

## 📸 **The Flow:**
1. Press button on Mentra OS glasses
2. Photo uploads to your SistaChat storage
3. AI Fashion Sister calls your phone with styling advice
4. That's it! No database setup needed.

## 🚀 **Quick Setup (3 minutes):**

### 1. **Get Your Existing App Info:**
- Go to [console.mentra.glass](https://console.mentra.glass)
- Find your existing app
- Copy the **API Key** and **Package Name**
- Note your **Public URL** (you'll update this)

### 2. **Create Mentra Integration Project:**
```bash
mkdir ai-fashion-sister-mentra
cd ai-fashion-sister-mentra
npm init -y
```

### 3. **Install Dependencies:**
```bash
npm install @mentra/sdk @supabase/supabase-js express dotenv
npm install -D typescript @types/node @types/express ts-node
```

### 4. **Create Files:**

**`.env`:**
```env
# Your existing Mentra app details
PACKAGE_NAME=your_existing_package_name
MENTRAOS_API_KEY=your_existing_api_key
PORT=3000

# From your existing SistaChat project
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Already configured VAPI
VAPI_API_KEY=c10a907b-8e5c-4cf2-bd05-ac66722ffaa9
VAPI_ASSISTANT_ID=f7dfb141-98ff-4e33-b24d-c88220fd792f

# YOUR phone number for receiving calls
MENTRA_CALLBACK_NUMBER=+1234567890
```

**`app.ts`:** (Copy the code from `mentra-integration-simple.ts`)

### 5. **Run the Integration:**
```bash
npx ts-node app.ts
```

### 6. **Expose with ngrok:**
```bash
ngrok http 3000
```

### 7. **Update Your Existing Mentra App:**
- Go back to [console.mentra.glass](https://console.mentra.glass)
- Edit your existing app
- Update **Public URL** to your ngrok URL (e.g., `https://abc123.ngrok.io`)
- Save changes

### 8. **Test:**
- Launch your existing app on Mentra OS glasses
- Press button → take photo
- Wait for "AI Fashion Sister is calling you now!"
- Answer your phone for styling advice! 🔥

## 🎮 **How to Use:**

- **Short Press:** Single photo + voice feedback
- **Long Press:** Toggle streaming mode for continuous analysis

## 🔧 **Key Features:**

✅ **Uses your existing Mentra app** - no new setup needed  
✅ **No database migrations** - uses existing SistaChat storage  
✅ **Instant setup** - 3-minute configuration  
✅ **Voice feedback** - AI calls your phone with advice  
✅ **Streaming mode** - continuous outfit analysis  
✅ **Smart glasses UI** - shows status on glasses display  

## 🚨 **Troubleshooting:**

1. **App won't connect:** Ensure ngrok URL is updated in Mentra console
2. **Package name error:** Check `.env` matches your existing app exactly
3. **No photo upload:** Verify `SUPABASE_SERVICE_ROLE_KEY`
4. **No VAPI call:** Check phone number format (`+1234567890`)

## 💡 **What's Next:**

Once this works, you can:
- Add the database migration for tracking
- Build the web interface  
- Add user authentication
- Customize AI sister prompts

**You'll have: Smart glasses → Photo → Voice styling advice!** 🎉

## 📋 **Quick Checklist:**

- [ ] Copy existing Package Name & API Key from Mentra console
- [ ] Create new integration project folder
- [ ] Set up `.env` with your credentials
- [ ] Copy `app.ts` code
- [ ] Run `npx ts-node app.ts`
- [ ] Start ngrok and update Mentra console URL
- [ ] Test on your glasses!

**That's it! Your existing Mentra app will now have AI Fashion Sister powers!** ✨ 