# GCCN Nursing Portal

A modern, fast, and feature-rich educational portal for BSc in Nursing. Contains interactive schedule grids, dynamic subject filters for study PDFs, a notice board, a health calorie meter & workout suggestion calculator, and a secure monthly expense tracker.

## Features
- **Educational Storehouse**: Dynamic PDF category filters for Fundamentals of Nursing, Nutrition, Orthopedics, Pediatrics, Surgery, Pharmacology, and more.
- **Admin Control Panel**: Lock/unlock administrative options (uploading PDFs, deleting entries, posting notices, modifying workouts, tracking monthly expenses) using the secure owner passcode (`shuaib132020`).
- **Calorie Meter & Workout Calculator**: Daily maintenance TDEE math, goal progress trackers, and optimal split recommendations.
- **Monthly Expense Ledger**: A passcode-protected tracker featuring spent indicators, custom pocket money inputs, category breakdown bars, and saved historical logs.

## Deployment to Vercel
This project is built using vanilla HTML, CSS, and JavaScript. You can deploy it to Vercel in seconds:

1. **Upload to GitHub**:
   - Create a new repository on GitHub (do not initialize with a README).
   - Open Git Bash, terminal, or PowerShell in this folder and run:
     ```bash
     git init
     git add .
     git commit -m "Initial commit of GCCN Portal"
     git branch -M main
     git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
     git push -u origin main
     ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com/) and log in using your GitHub account.
   - Click **Add New** -> **Project**.
   - Import this GitHub repository.
   - Vercel will automatically detect it as a static site. Click **Deploy**.
   - Your website is now live!
