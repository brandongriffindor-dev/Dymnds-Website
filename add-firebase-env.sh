#!/bin/bash
# Add Firebase env vars to Vercel
cd ~/Desktop/Dymnds-Emotional

# Add each env var (values will be prompted securely)
echo "Adding Firebase config to Vercel..."

vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
echo "Added API Key"

vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production  
echo "Added Auth Domain"

vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
echo "Added Project ID"

vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
echo "Added Storage Bucket"

vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
echo "Added Messaging Sender ID"

vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
echo "Added App ID"

echo "All Firebase config added! Now run: vercel --prod"
