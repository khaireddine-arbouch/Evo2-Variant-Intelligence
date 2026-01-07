# Supabase Email Template Configuration

## Email Redirect URLs

The application is now configured to use your production URL for email redirects. Make sure to:

1. Set the `NEXT_PUBLIC_SITE_URL` environment variable to your production domain (e.g., `https://evo2-variant-intelligence.com`)

2. Configure Supabase Dashboard:
   - Go to Authentication → URL Configuration
   - Add your production URL to "Redirect URLs"
   - Set "Site URL" to your production URL

## Email Template Styling

To customize the email templates in Supabase:

1. Go to **Authentication → Email Templates** in your Supabase Dashboard

2. Customize the following templates:
   - **Confirm signup**: The email sent when users sign up
   - **Magic Link**: If you enable magic link authentication
   - **Change Email Address**: For email change confirmations
   - **Reset Password**: For password reset emails

3. You can use HTML in the email templates. Example styling:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #020809;
      color: #ffffff;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0a0f14;
      border: 1px solid #1a1f24;
      border-radius: 8px;
      padding: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #22c55e;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #1a1f24;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Evo2 Variant Intelligence</h1>
    </div>
    <p>Click the button below to confirm your email address:</p>
    <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
    <div class="footer">
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>
```

4. Available template variables:
   - `{{ .ConfirmationURL }}` - The confirmation link
   - `{{ .Token }}` - The confirmation token (if needed)
   - `{{ .Email }}` - User's email address
   - `{{ .SiteURL }}` - Your site URL

## Environment Variables

Make sure these are set in your production environment:

```env
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

After configuring:
1. Test the signup flow to ensure emails are sent with the correct redirect URL
2. Verify that clicking the confirmation link redirects to your production site
3. Check that the email styling matches your brand

