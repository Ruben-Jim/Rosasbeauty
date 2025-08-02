# Deploy to GitHub Pages

## Steps to deploy your beauty salon app to GitHub Pages:

### 1. Prepare the static files
Your static files are already built in `dist/public/`:
- `dist/public/index.html` - Main page
- `dist/public/assets/` - CSS and JavaScript files

### 2. Create a GitHub repository
1. Go to GitHub and create a new repository
2. Name it something like `beauty-salon-app`
3. Make it public (required for free GitHub Pages)

### 3. Upload your files
Upload only the contents of `dist/public/` folder:
- index.html
- assets/ folder with all files

### 4. Enable GitHub Pages
1. Go to repository Settings
2. Scroll to "Pages" section
3. Source: Deploy from a branch
4. Branch: main (or master)
5. Folder: / (root)
6. Save

### 5. Important Notes
- GitHub Pages only hosts static files - no backend server
- Your app currently needs API calls that won't work without a backend
- Consider using Replit deployment instead for the full working app

### Alternative: Use Both Services
1. Deploy full app to Replit (with backend) - for full functionality
2. Deploy static version to GitHub Pages - for showcase/portfolio

The Replit deployment will give you a fully working beauty salon booking system.
The GitHub Pages version will be a static showcase without booking functionality.