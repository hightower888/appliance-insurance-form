# Appliance Insurance Form

A simple, responsive web form for collecting appliance insurance inquiries. Built with pure HTML, CSS, and JavaScript, with Firebase Realtime Database integration.

## 📦 Files

- **appliance_form.html** - Main HTML form (single page)
- **styles.css** - Responsive styles (mobile-first design)
- **app.js** - Form logic, validation, and Firebase integration
- **README.md** - This file

## 🚀 Quick Start

### 1. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Go to **Realtime Database** → Create Database
4. Choose **Start in test mode** (for development)
5. Go to **Project Settings** → General
6. Scroll to **Your apps** → Web app
7. Copy your Firebase configuration

### 2. Configure Firebase

Edit `appliance_form.html` and replace the Firebase config (around line 165):

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Set Firebase Security Rules

In Firebase Console → Realtime Database → Rules, add:

```json
{
  "rules": {
    "inquiries": {
      ".write": true,
      ".read": false,
      "$inquiry": {
        ".validate": "newData.hasChildren(['timestamp', 'contact', 'appliances'])"
      }
    }
  }
}
```

**⚠️ Important:** For production, add proper authentication and rate limiting!

### 4. Test Locally

Simply open `appliance_form.html` in your browser. No build step required!

```bash
# Option 1: Open directly
open appliance_form.html

# Option 2: Use a local server (recommended)
python3 -m http.server 8000
# Then visit: http://localhost:8000/appliance_form.html

# Option 3: Use VS Code Live Server extension
# Right-click appliance_form.html → "Open with Live Server"
```

## 🎨 Features

### Contact Details
- Full Name
- Email (validated)
- Phone (UK format: 07XXXXXXXXX)
- Address
- Postcode

### Dynamic Appliances (1-10)
- Appliance Type (dropdown: Washing Machine, Dryer, Dishwasher, etc.)
- Make/Brand
- Model
- Age (5 ranges)
- Cover Limit (£500 or £800)
- Add/Remove functionality

### Optional Boiler Cover
- 3 plan tiers:
  - **Basic** - £14.99/month (Annual service + breakdown cover)
  - **Plus** - £19.99/month (+ parts replacement)
  - **Premium** - £24.99/month (+ full boiler replacement)

### Real-Time Cost Calculator
- Updates automatically as user selects options
- Shows total monthly cost

### Form Validation
- Real-time validation (on blur)
- Required field checking
- Email format validation
- UK phone format validation
- Submit button disabled until form is valid

### Responsive Design
- Mobile-first (320px+)
- Tablet optimized (768px+)
- Desktop optimized (1024px+)
- Touch-friendly (44px minimum touch targets)

## 📊 Data Structure

Data is stored in Firebase at `/inquiries/{auto-generated-id}`:

```json
{
  "timestamp": 1704744000000,
  "submittedAt": "2026-01-08T12:00:00.000Z",
  "contact": {
    "fullName": "John Smith",
    "email": "john@example.com",
    "phone": "07123456789",
    "address": "123 High Street",
    "postcode": "SW1A 1AA"
  },
  "appliances": [
    {
      "type": "washing_machine",
      "make": "Bosch",
      "model": "Serie 6 WAT28371GB",
      "age": "1-2",
      "coverLimit": 800,
      "monthlyCost": 12.99
    }
  ],
  "boiler": {
    "included": true,
    "plan": "19.99",
    "planName": "Plus Boiler Cover",
    "monthlyCost": 19.99
  },
  "estimatedMonthlyCost": 32.98,
  "status": "pending"
}
```

## 🚀 Deployment Options

### Option 1: Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting
# Choose your project
# Set public directory to current directory (or ".")
# Configure as single-page app? No
# Set up automatic builds? No

# Deploy
firebase deploy --only hosting
```

Your site will be live at: `https://YOUR_PROJECT.firebaseapp.com`

### Option 2: Netlify (Easiest)

1. Go to [netlify.com](https://www.netlify.com/)
2. Drag and drop all 3 files (HTML, CSS, JS)
3. Done! Your site is live

### Option 3: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Option 4: GitHub Pages

1. Create a GitHub repository
2. Push all 3 files to the repo
3. Go to Settings → Pages
4. Select main branch as source
5. Your site will be at: `https://YOUR_USERNAME.github.io/REPO_NAME/appliance_form.html`

### Option 5: Any Web Server

Simply upload the 3 files to any web hosting:
- Shared hosting (cPanel, etc.)
- VPS
- AWS S3 + CloudFront
- Azure Static Web Apps
- Any other static hosting

No server-side code or database needed (Firebase handles that)!

## 🧪 Testing

### Manual Testing Checklist

- [ ] Form loads correctly
- [ ] Can fill in contact details
- [ ] Email validation works
- [ ] Phone validation works (must start with 07)
- [ ] Can add appliances (up to 10)
- [ ] Can remove appliances (minimum 1)
- [ ] Boiler section shows/hides on checkbox
- [ ] Total cost calculates correctly
- [ ] Submit button is disabled until form is valid
- [ ] Form submits to Firebase successfully
- [ ] Success message displays after submission
- [ ] Form resets after successful submission
- [ ] Responsive on mobile (test at 320px, 375px, 414px)
- [ ] Responsive on tablet (test at 768px, 1024px)
- [ ] Responsive on desktop (test at 1920px)

### Browser Testing

Test in:
- ✅ Chrome (desktop + mobile)
- ✅ Firefox
- ✅ Safari (desktop + mobile)
- ✅ Edge

## 🔒 Security Notes

**Current Setup (Development):**
- Firebase rules allow anyone to write to `/inquiries`
- No authentication required
- No rate limiting

**For Production, Add:**

1. **Rate Limiting** (Firebase Security Rules):
```json
{
  "rules": {
    "inquiries": {
      ".write": "!data.exists() && newData.exists()",
      ".read": false,
      ".indexOn": ["timestamp"]
    }
  }
}
```

2. **ReCAPTCHA** (to prevent bots):
- Add Google reCAPTCHA v3 to the form
- Verify token before Firebase submission

3. **Cloud Functions** (for validation):
- Create a Firebase Cloud Function to validate data
- Move Firebase write logic to server-side

4. **HTTPS Only**:
- Ensure your site is served over HTTPS
- Firebase Hosting does this automatically

## 📝 Customization

### Change Colors

Edit `styles.css` and modify these variables:

```css
/* Primary color (buttons) */
background: #2563eb; /* Change to your brand color */

/* Secondary color (add buttons) */
background: #10b981; /* Change to your accent color */

/* Danger color (remove buttons) */
background: #ef4444; /* Keep red or change */
```

### Change Appliance Types

Edit `app.js`, find the `addAppliance()` function, and modify the dropdown options:

```javascript
<option value="your_type">Your Appliance Type</option>
```

### Change Boiler Plans

Edit `appliance_form.html`, find the boiler section, and modify the radio options:

```html
<label class="radio-label">
  <input type="radio" name="boilerPlan" value="YOUR_PRICE" data-plan-name="Your Plan Name">
  <span class="radio-content">
    <span class="radio-title">Your Plan Name - £XX.XX/month</span>
    <span class="radio-description">Your plan description</span>
  </span>
</label>
```

## 🐛 Troubleshooting

### Form doesn't submit
- Check browser console for errors
- Verify Firebase config is correct
- Check Firebase Realtime Database rules
- Ensure database exists (not Firestore)

### "Firebase is not defined" error
- Verify Firebase SDK scripts are loaded (check Network tab)
- Ensure scripts are loaded before `app.js`
- Check internet connection

### Styling looks broken
- Ensure `styles.css` is in the same directory as HTML
- Check browser console for 404 errors
- Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)

### Data not appearing in Firebase
- Go to Firebase Console → Realtime Database
- Check the "Data" tab (not "Firestore")
- Look under `/inquiries/`
- Check security rules allow writes

## 📄 License

This is a simple web form template. Feel free to use and modify as needed.

## 💡 Next Steps

- Add email notifications (using Firebase Cloud Functions + SendGrid)
- Add admin dashboard to view submissions
- Add PDF quote generation
- Integrate actual payment processing (Stripe, PayPal, etc.)
- Add authentication (Firebase Auth)
- Add data export functionality

---

**Need Help?** Check the browser console (F12) for error messages.
