# Firebase Auth Setup for Dymnds Admin

## Step 1: Update Firebase Security Rules

Go to: https://console.firebase.google.com/project/dymnds-app/firestore/rules

Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - authenticated users can read/write
    match /products/{product} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Orders - authenticated users can read/write
    match /orders/{order} {
      allow read, write: if request.auth != null;
    }
    
    // Waitlist - public can write (for signup), authenticated can read
    match /app_waitlist/{email} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

Click **Publish**.

## Step 2: Create Admin User

Go to: https://console.firebase.google.com/project/dymnds-app/authentication/users

Click **Add User** and enter:
- Email: admin@weardymnds.com (or your preferred email)
- Password: Create a strong password (save this in your password manager)

## Step 3: Test Login

1. Go to http://localhost:3000/admin
2. Enter your email and password
3. Click Sign In
4. You should see the admin dashboard

## Step 4: Deploy Changes

```bash
git add .
git commit -m "Add Firebase Auth to admin dashboard"
git push
```

The admin will now require login before showing product data or allowing add/edit operations.
