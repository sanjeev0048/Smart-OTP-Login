Smart OTP Login (Frontend)

A simple OTP (One-Time Password) login system using HTML, CSS, and JavaScript.

Features

OTP via SMS/Email/WhatsApp (backend required)

4–6 digit OTP input with auto-focus & paste support

Resend OTP button with countdown

Responsive and mobile-friendly UI

How It Works

User enters phone/email → click Send OTP

OTP input fields appear → enter code

Code is verified with backend API → login success

Files

index.html → UI structure

style.css → Styling (responsive, mobile friendly)

script.js → Logic for sending & verifying OTP

Setup

Clone project or download files

Update API URLs in script.js with your backend endpoints

Open index.html in your browser

Security Notes

Use HTTPS for API calls

Keep OTP short-lived (1–2 mins)

Limit resend attempts to prevent abuse

