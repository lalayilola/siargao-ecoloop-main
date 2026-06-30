# Supabase Authentication Setup Guide

This guide explains how to configure Supabase for the EcoLoop Siargao authentication system with real email verification.

## Prerequisites

- A Supabase project created at [supabase.com](https://supabase.com)
- Access to the Supabase dashboard

## Step 1: Enable Google OAuth

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Google** provider
4. Enable **Enable Google provider**
5. Enter your Google OAuth credentials:
   - **Client ID**: Get from Google Cloud Console
   - **Client Secret**: Get from Google Cloud Console
6. Enter your redirect URL:
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
7. Click **Save**

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure the consent screen if prompted
6. Select **Web application**
7. Add authorized redirect URIs:
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
8. Copy the Client ID and Client Secret
9. Paste them into your Supabase Google provider settings

## Step 2: Enable Email Verification

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Email** provider
4. Ensure **Enable Email provider** is checked
5. Under **Confirm email**, select **Double opt-in** (recommended for production)
6. Click **Save**

## Step 2: Configure Email Templates

### Verification Email Template

1. Navigate to **Authentication** → **Email Templates**
2. Select **Confirm signup** template
3. Customize the email template with your branding:

**Subject:**
```
Verify your EcoLoop Siargao account
```

**Body (HTML):**
```html
<h2>Welcome to EcoLoop Siargao!</h2>
<p>Thank you for registering. Please verify your email address to activate your account.</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't create an account, please ignore this email.</p>
```

### Password Reset Email Template

1. Select **Reset password** template
2. Customize the email template:

**Subject:**
```
Reset your EcoLoop Siargao password
```

**Body (HTML):**
```html
<h2>Password Reset Request</h2>
<p>You requested to reset your password. Click the link below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
```

## Step 3: Configure Redirect URLs

### Site URL

1. Navigate to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain:
   - Development: `http://localhost:5173`
   - Production: `https://your-domain.com`

### Allowed Redirect URLs

Add the following URLs to **Allowed Redirect URLs**:

**Development:**
```
http://localhost:5173/*
http://localhost:5173/auth/callback
http://localhost:5173/verify-email
http://localhost:5173/reset-password
```

**Production:**
```
https://your-domain.com/*
https://your-domain.com/auth/callback
https://your-domain.com/verify-email
https://your-domain.com/reset-password
```

### Email Confirmation Redirect URL

Set **Email Confirmation Redirect URL** to:
- Development: `http://localhost:5173/verify-email`
- Production: `https://your-domain.com/verify-email`

## Step 4: Configure SMTP Settings (Optional)

For production, configure custom SMTP settings:

1. Navigate to **Authentication** → **Email Templates**
2. Click on **SMTP Settings**
3. Enable **Custom SMTP**
4. Enter your SMTP provider details:
   - **SMTP Host**: your SMTP server
   - **SMTP Port**: 587 (TLS) or 465 (SSL)
   - **SMTP User**: your SMTP username
   - **SMTP Password**: your SMTP password
   - **Sender Email**: noreply@your-domain.com
   - **Sender Name**: EcoLoop Siargao

## Step 5: Test Email Verification

1. Start your development server
2. Navigate to `/register`
3. Fill out the registration form with a real email address
4. Submit the form
5. Check your email inbox for the verification link
6. Click the link to verify your email
7. You should be redirected to `/verify-email` with a success message
8. After verification, you'll be redirected to your dashboard

## Step 6: Test Password Reset

1. Navigate to `/forgot-password`
2. Enter your email address
3. Submit the form
4. Check your email inbox for the reset link
5. Click the link to set a new password
6. Enter your new password and confirm
7. You should be redirected to `/login`

## Database Schema

Ensure your `profiles` table has the following structure:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  barangay TEXT NOT NULL,
  address TEXT,
  primary_role TEXT NOT NULL CHECK (primary_role IN ('farmer', 'restaurant', 'resident', 'lgu_admin')),
  municipality TEXT NOT NULL,
  profile_picture_url TEXT,
  lgu_approved BOOLEAN DEFAULT FALSE,
  government_id_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

## Role-Based Access Control

The system supports the following roles:

- **farmer**: Access to farmer dashboard and produce listings
- **restaurant**: Access to hotel/restaurant dashboard and waste reporting
- **lgu_admin**: Access to LGU admin dashboard and all management features
- **resident**: Basic access to marketplace and feed

Users are redirected to their appropriate dashboard after login based on their `primary_role` in the `profiles` table.

## Troubleshooting

### Emails Not Sending

- Check SMTP settings in Supabase dashboard
- Verify email templates are configured
- Check Supabase logs for errors
- Ensure email provider allows sending from your domain

### Verification Link Not Working

- Verify redirect URLs are correctly configured
- Check that the verification URL matches your allowed redirect URLs
- Ensure the link hasn't expired (24 hours for signup, 1 hour for password reset)

### User Cannot Sign In After Registration

- Ensure email verification is required (Double opt-in)
- Check that the user has clicked the verification link
- Verify the user's email_confirmed_at timestamp is set in the database

### Rate Limiting Errors

- The system has built-in rate limiting (3 minutes cooldown)
- This prevents abuse of the authentication system
- Users will see a message to wait before trying again

## Security Best Practices

1. **Always use HTTPS in production**
2. **Enable email verification** to prevent fake accounts
3. **Use strong password policies** (minimum 8 characters)
4. **Implement rate limiting** to prevent brute force attacks
5. **Monitor authentication logs** for suspicious activity
6. **Keep SMTP credentials secure** and rotate them regularly
7. **Use environment variables** for sensitive configuration

## Environment Variables

Ensure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_SUPABASE_STORAGE_BUCKET=uploads
```

## Production Checklist

- [ ] Enable email verification (Double opt-in)
- [ ] Configure custom SMTP settings
- [ ] Set production domain in Site URL
- [ ] Add production URLs to Allowed Redirect URLs
- [ ] Customize email templates with branding
- [ ] Test email verification flow
- [ ] Test password reset flow
- [ ] Enable RLS on all tables
- [ ] Set up authentication monitoring
- [ ] Configure rate limiting
- [ ] Review security policies
- [ ] Test role-based redirects
