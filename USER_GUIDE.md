# User Guide - Appliance Insurance Form System

**Welcome to the Appliance Insurance Form Management System!**

This guide will help you navigate and use all the features of the system.

---

## 🔐 Getting Started

### Login

1. Go to: **https://appliance-cover-form.vercel.app/login.html**
2. Enter your credentials:
   - **Email**: `kenan@theflashteam.co.uk`
   - **Password**: `Dan-Ai-Mate`
3. Click **"Log In"**

**Note**: After 5 failed login attempts, your account will be locked for 15 minutes for security.

---

## 👑 Admin Panel Overview

Once logged in as admin, you'll see the Admin Panel with three main tabs:

1. **Users** - Manage user accounts
2. **Sales** - View and export sales data
3. **Form Fields** - Manage dynamic form fields

---

## 👥 User Management

### Creating a New User

1. Click on the **"Users"** tab in the Admin Panel
2. Click the **"Create New User"** button
3. Fill in the form:
   - **Email**: User's email address (required)
   - **Password**: Must be at least 6 characters (required)
   - **Role**: Select from dropdown:
     - **Admin**: Full access to all features
     - **Agent**: Can submit forms (default)
     - **Processor**: Can view sales and export CSV with custom mappings
4. Click **"Create User"**

**Success!** The new user will be created and can immediately log in with their credentials.

### Viewing All Users

- All users are displayed in a table showing:
  - Email address
  - Role (Admin, Agent, or Processor)
  - Status (Active/Inactive)
  - Actions (Edit, Delete)

### Editing a User

1. Find the user in the Users table
2. Click the **"✏️ Edit"** button
3. Update the email or role
4. Click **"Save Changes"**

**Note**: You cannot change a user's password through the admin panel. Users must reset their own passwords (if that feature is added later).

### Deleting/Deactivating a User

1. Find the user in the Users table
2. Click the **"🗑️ Delete"** button
3. Confirm the deletion

**Note**: This will deactivate the user account. The user will no longer be able to log in.

---

## 📊 Sales Data Management

### Viewing Sales

1. Click on the **"Sales"** tab
2. All submitted forms are displayed in a table showing:
   - Date submitted
   - Customer name and email
   - Agent who submitted
   - Plan type
   - Total cost
   - Actions

### Searching Sales

- Use the **search box** at the top to search across all fields
- Search works on customer names, emails, addresses, and more

### Filtering Sales

- **Filter by Agent**: Select an agent from the dropdown to see only their sales
- **Filter by Plan**: Select "Appliance" or "Appliance + Boiler" to filter by plan type
- Filters can be combined with search

### Sorting Sales

- Click any column header to sort:
  - **Date**: Sort by submission date
  - **Customer**: Sort alphabetically by customer name
  - **Agent**: Sort by agent email
  - **Plan**: Sort by plan type
  - **Total Cost**: Sort by cost amount
- Click again to reverse the sort order
- Visual indicators (↑↓) show the current sort

### Viewing Sale Details

1. Click the **"👁️ View"** button on any sale
2. A detailed modal will show:
   - Contact information
   - Plan & payment details
   - All appliances listed
   - Additional dynamic fields
   - Notes
   - Metadata (agent, submission time, sale ID)

### Exporting Sales to CSV

1. Apply any filters or search if needed
2. Click the **"📥 Export CSV"** button
3. A CSV file will download with all visible sales data
4. The file includes all fields from the sales

---

## 📝 Form Field Management

### Overview

The Form Fields tab allows you to customize the form that agents see when submitting sales. You can add, remove, and configure fields.

### Viewing Form Fields

1. Click on the **"Form Fields"** tab
2. See all current form fields in a table showing:
   - Display order
   - Field name (internal)
   - Field label (what users see)
   - Field type
   - Section
   - Required status
   - Actions

### Adding a New Field

1. Click **"➕ Add New Field"**
2. Fill in the form:
   - **Field Name**: Internal identifier (e.g., `customer_phone`)
   - **Field Label**: What users see (e.g., "Phone Number")
   - **Field Type**: Select from:
     - `text` - Text input
     - `email` - Email input
     - `tel` - Phone number input
     - `number` - Number input
     - `select` - Dropdown menu
     - `textarea` - Multi-line text
     - `checkbox` - Checkbox
     - `radio` - Radio buttons
   - **Section**: Group fields (e.g., "Contact Details", "Payment")
   - **Display Order**: Lower numbers appear first
   - **Required**: Toggle to make field mandatory
   - **Default Value**: Pre-filled value (optional)
   - **Help Text**: Instructions shown below field (optional)
3. For **select** or **radio** types, add options:
   - Click **"➕ Add Option"**
   - Enter value and label for each option
4. Click **"💾 Save Field"**

### Editing a Field

1. Find the field in the table
2. Click **"✏️ Edit"**
3. Update any settings
4. Click **"💾 Save Field"**

**Note**: Field name cannot be changed after creation (to maintain data integrity).

### Toggling Required Status

- Use the **toggle switch** in the Required column
- Green = Required, Gray = Optional
- Changes take effect immediately

### Reordering Fields

- Use the **⬆️** and **⬇️** buttons to move fields up or down
- Fields are displayed in the order shown in the table

### Deleting a Field

1. Find the field in the table
2. Click **"🗑️ Delete"**
3. Confirm deletion

**Note**: Deleting a field removes it from new forms, but existing submissions will still have the data.

---

## 🔄 User Roles Explained

### Admin
- Full access to all features
- Can create, edit, and delete users
- Can view all sales data
- Can manage form fields
- Can export sales data

### Agent
- Can log in and submit appliance insurance forms
- Cannot view sales data
- Cannot access admin panel
- Forms they submit are automatically associated with their account

### Processor
- Can view sales data (read-only)
- Can export sales data to CSV
- Can customize CSV field mappings
- Cannot create users or manage form fields
- Has their own dashboard at `/processor.html`

---

## 🚪 Logging Out

- Click the **"Logout"** button in the top right corner
- You'll be redirected to the login page
- Your session will be cleared

---

## 🔒 Security Features

### Brute Force Protection
- After 5 failed login attempts, the account is locked for 15 minutes
- Attempts are tracked per email address
- Lockout resets automatically after the timeout period
- Successful login resets the attempt counter

### Password Security
- All passwords are hashed using SHA-256
- Passwords are never stored in plain text
- Minimum password length: 6 characters (recommended: 8+ with mixed characters)

---

## 📱 Accessing the System

### For Agents
- Login at: `/login.html`
- After login, redirected to: `/appliance_form.html`
- Submit appliance insurance forms

### For Processors
- Login at: `/login.html`
- After login, redirected to: `/processor.html`
- View sales and export CSV with custom mappings

### For Admins
- Login at: `/login.html`
- After login, redirected to: `/admin.html`
- Full access to all features

---

## 🆘 Troubleshooting

### Can't Log In
- Check email and password are correct
- If locked out, wait 15 minutes or clear browser sessionStorage
- Make sure you're using the correct URL

### Can't Create Users
- Make sure you're logged in as admin
- Check that email isn't already in use
- Ensure password is at least 6 characters

### Can't See Sales Data
- Verify you're logged in as admin or processor
- Check that forms have been submitted
- Try refreshing the page

### Form Fields Not Showing
- Check that fields are marked as active
- Verify the display order is set correctly
- Make sure fields are in the correct section

---

## 📞 Support

For technical issues or questions:
- Check this guide first
- Review the browser console for error messages
- Contact your system administrator

---

## 🎯 Quick Reference

### Common Tasks

**Create a new agent:**
1. Users tab → Create New User → Enter email/password → Select "Agent" → Create

**View recent sales:**
1. Sales tab → Sales are sorted by date (newest first)

**Export sales data:**
1. Sales tab → Apply filters if needed → Click "Export CSV"

**Add a form field:**
1. Form Fields tab → Add New Field → Fill form → Save

**Make a field required:**
1. Form Fields tab → Toggle switch in Required column

**Edit a user:**
1. Users tab → Find user → Click Edit → Update → Save

---

## 📋 Best Practices

1. **User Management**
   - Use descriptive email addresses
   - Set strong passwords for new users
   - Regularly review and deactivate unused accounts

2. **Form Fields**
   - Group related fields in the same section
   - Use clear, descriptive labels
   - Only make fields required if absolutely necessary
   - Test new fields before making them required

3. **Sales Data**
   - Export data regularly for backup
   - Use filters to find specific sales quickly
   - Review sales details before exporting

4. **Security**
   - Don't share login credentials
   - Log out when finished
   - Report suspicious activity immediately

---

**Last Updated**: January 2025  
**Version**: 1.0
