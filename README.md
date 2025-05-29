# Violet Mail - Email System

A full-stack email management system built with Node.js, React, and MySQL.

## Features

- User authentication with secure password hashing
- Send and receive emails in real-time
- Responsive web interface
- Email reply functionality
- Modern glassmorphism UI design

## Tech Stack

- **Frontend**: React, CSS3, Font Awesome
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: bcrypt, Express sessions

## Installation

1. Clone the repository

```bash
git clone https://github.com/HEXXXxxxuan/violet-mail-js.git
cd violet-mail-js
```

2. Install dependencies

```bash
npm install
```

3. Set up MySQL database
   - Create database named `email_system`
   - Import the SQL schema

4. Start the server

```bash
npm start
```

5. Open http://localhost:3001
   - Login: `user1` / `password`

## API Routes

- `POST /api/login` - User login
- `GET /api/inbox` - Get emails
- `GET /api/sent` - Get sent emails  
- `POST /api/send-email` - Send email
- `GET /api/check-emails` - Check new emails

## Project Structure

```
violet-mail-js/
├── server.js          # Express server
├── package.json       # Dependencies
└── public/
    ├── index.html     # Main HTML
    ├── style.css      # Styles
    └── app.js         # React components
```

Built with modern JavaScript technologies for learning full-stack development.
