# Infinity Mercenaries

## Firebase Setup & Deployment

### Initial Setup

1. Install Firebase CLI:

   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:

   ```
   firebase login
   ```

3. Initialize your project (if not already done):
   ```
   firebase init
   ```

### Deploying Firestore Security Rules

After making changes to `firestore.rules`, deploy them:

```
firebase deploy --only firestore:rules
```

### Run Emulators

For local development:

```
firebase emulators:start
```

### Full Deployment

To deploy everything:

```
firebase deploy
```

## Troubleshooting

### Missing or Insufficient Permissions

If you see "Missing or insufficient permissions" errors:

1. Ensure you've deployed your latest Firestore rules:

   ```
   firebase deploy --only firestore:rules
   ```

2. Verify that you're signed in to your Firebase account:

   ```
   firebase login
   ```

3. Check the Firebase Console to ensure:

   - The Firestore database is created and enabled
   - Your user has proper permissions in the Firebase project
   - The security rules in the Firebase Console match your local rules

4. For development, you can temporarily use more permissive rules, but remember to restrict them before production deployment.
