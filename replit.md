# CloudVault

A file management web application imported from Lovable.

## Overview
CloudVault is a frontend-only React application for file management with features including:
- File upload via drag & drop
- File organization (My Drive, Recent, Starred, Trash)
- Storage tracking
- Grid/list view toggle
- Search functionality
- **File Security Levels**: Standard, High, and Maximum security options
- **Double Encryption**: Maximum security files use double encryption with email-based decryption codes

## Security Feature Architecture
The security system supports three levels:
1. **Standard**: Basic single-layer encryption
2. **High**: Enhanced encryption with stronger algorithms
3. **Maximum**: Double encryption - requires secondary decryption code sent via email

### TODO: Email Integration
The email sending functionality for maximum security files is currently stubbed. To enable it:
1. Set up an email service integration (SendGrid, Resend, or Gmail)
2. Add the email sending API key as a secret
3. Implement the actual email sending in `DecryptionCodeDialog.tsx`

Currently, the decryption code verification works with a simulated "email sent" flow for demonstration purposes.

## Tech Stack
- React 18 with TypeScript
- Vite for development and build
- Tailwind CSS for styling
- Shadcn/UI components
- React Router for navigation
- TanStack Query for data fetching
- Lucide React for icons

## Project Structure
```
src/
├── components/
│   ├── files/       # File-related components (FileCard, FileGrid, UploadZone)
│   ├── layout/      # Layout components (Header, Sidebar)
│   └── ui/          # Shadcn UI components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── pages/           # Page components
├── App.tsx          # Main application component
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## Development
- Run: `npm run dev` (starts on port 5000)
- Build: `npm run build`
- Preview: `npm run preview`

## Deployment
Configured for static deployment. Build output goes to `dist/` directory.
