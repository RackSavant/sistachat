# SistaChat Setup Guide

## Overview
SistaChat is an AI-powered fashion feedback application where users can upload outfit photos and receive encouraging, honest feedback from an AI "sister" with personality.

## Features Implemented

### 🎯 Core Features
- **Chat Interface**: Main conversation view with image upload and text messaging
- **AI Sister Feedback**: Encouraging, honest feedback with personality using GPT-4o
- **Image Processing**: Background removal and enhancement (via Replicate API)
- **Shopping Suggestions**: Stub service that returns sample similar items
- **Chat History**: View and manage previous conversations

### 🗄️ Database Schema
- **profiles**: User profile information
- **chats**: Conversation threads
- **messages**: Individual messages with support for text, images, and AI feedback
- **subscriptions**: User subscription management
- **user_usage_quotas**: Track usage limits

### 🖼️ Image Processing Pipeline
1. **Upload**: Raw images stored in `raw-images` bucket
2. **Processing**: Background removal via Replicate API
3. **Enhancement**: Image optimization using Sharp
4. **Storage**: Processed images in `processed-images` bucket

## Setup Instructions

### 1. Environment Variables
Add these to your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# OpenAI for AI feedback
OPENAI_API_KEY=""

# Replicate for image processing
REPLICATE_API_TOKEN=""

# Database (if using external)
POSTGRES_URL=""
```

### 2. Database Setup

```bash
# Install dependencies
npm install

# Set up Supabase project structure
npx supabase init

# Apply migrations to your Supabase project
npm run db:push

# Generate TypeScript types
npm run db:types
```

### 3. Storage Buckets Setup

```bash
# Create required storage buckets
npm run setup:buckets
```

### 4. Run the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Usage Flow

### For Users
1. **Sign In**: Users authenticate via Supabase Auth
2. **Chat Interface**: Redirected to `/chat` after login
3. **Upload Images**: Drag & drop or click to upload outfit photos
4. **Receive Feedback**: 
   - Immediate reaction appears quickly
   - Detailed analysis follows with suggestions
   - Shopping recommendations show similar items
5. **Chat History**: Access previous conversations

### Technical Flow
1. **Image Upload**: File uploaded to `raw-images` bucket
2. **Message Creation**: Database record created with image URL
3. **Background Processing**: 
   - API call to `/api/process-outfit`
   - Background removal via Replicate
   - AI feedback generation via OpenAI
   - Shopping suggestions (stub data)
4. **Real-time Updates**: Chat interface refreshes with new feedback

## API Endpoints

### `/api/process-outfit` (POST)
Processes uploaded outfit images and generates feedback.

**Request:**
```json
{
  "messageId": "uuid",
  "imageUrl": "string",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "immediateFeedback": "string",
  "detailedFeedback": {...},
  "shoppingSuggestions": [...]
}
```

## Database Functions

- `get_or_create_current_chat(user_id)`: Gets or creates a chat for the user
- `increment_uploads(user_id, month_year_key)`: Tracks image upload usage
- `increment_feedback_requests(user_id, month_year_key)`: Tracks feedback usage

## AI Sister Personality

The AI feedback system is designed to feel like talking to a supportive sister:

- **Tone**: Casual, enthusiastic, encouraging
- **Language**: Uses phrases like "girl", "babe", "honestly", "I'm obsessed with"
- **Approach**: Honest but constructive feedback
- **Structure**: 
  - Immediate reaction (quick, enthusiastic)
  - Detailed analysis (what works, what could improve)
  - Specific suggestions (actionable items)
  - Encouragement (confidence boost)
  - Vibe classification (fire/cute/chic/casual/bold/sweet)

## Future Enhancements

### Planned Features
- **Real Shopping Integration**: Connect to actual shopping APIs
- **Advanced Image Processing**: Better background removal and style analysis
- **Chat Switching**: Navigate between different conversation threads
- **Style Profiles**: Learn user preferences over time
- **Social Features**: Share outfits with friends
- **Subscription Tiers**: Different levels of feedback detail

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live feedback
- **Image Optimization**: Better compression and loading
- **Caching**: Redis for faster response times
- **Analytics**: Track user engagement and feedback quality

## Troubleshooting

### Common Issues

1. **Storage Bucket Errors**: Run `npm run setup:buckets` to create buckets
2. **Database Connection**: Verify Supabase environment variables
3. **Image Processing Fails**: Check Replicate API token and quota
4. **AI Feedback Empty**: Verify OpenAI API key and model access

### Development Tips

- Use `npm run db:types` after schema changes
- Check Supabase dashboard for storage and database issues
- Monitor API usage for OpenAI and Replicate
- Test image uploads with different file types and sizes

## Contributing

When adding new features:
1. Update database schema with migrations
2. Regenerate TypeScript types
3. Update this documentation
4. Test the complete user flow
5. Consider mobile responsiveness

---

Built with ❤️ for the sisterhood! ✨ 