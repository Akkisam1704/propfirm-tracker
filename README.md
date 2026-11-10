# Prop firm spend tracker

Upload a CSV, see spending by firm. The site runs on Render, the code lives on GitHub, and your data is saved as `propfirm-data.json` in a Google Drive folder you own.

## 1. Google Drive setup (about 10 minutes)
1. Go to console.cloud.google.com and create a project.
2. Open **APIs & Services > Library**, search for **Google Drive API**, click **Enable**.
3. Open **APIs & Services > Credentials > Create credentials > Service account**. Give it any name and finish.
4. Click the new service account, open **Keys > Add key > Create new key > JSON**. A file downloads. Keep it private.
5. Copy the service account email from the JSON (the `client_email` value).
6. In Google Drive, create a folder (for example "PropFirmData"). Right-click it, **Share**, paste the service account email, give it **Editor** access.
7. Open the folder and copy the ID from the address bar: `drive.google.com/drive/folders/THIS_PART`.

## 2. GitHub
1. Create a new **private** repository on github.com.
2. Upload every file in this folder (`server.js`, `package.json`, `.gitignore`, `README.md` and the `public` folder with `index.html`). Do not upload the Google JSON key.

## 3. Render
1. On render.com choose **New > Web Service** and connect your GitHub repository.
2. Settings: Runtime **Node**, Build command `npm install`, Start command `npm start`.
3. Under **Environment**, add three variables:
   - `APP_PASSWORD`: a password you choose. Your browser asks for it when you open the site (username can be anything).
   - `DRIVE_FOLDER_ID`: the folder ID from step 1.7.
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: open the downloaded JSON key in a text editor and paste the entire contents.
4. Click **Create Web Service**. When the deploy finishes, open the `.onrender.com` link.

## Notes
- On Render's free plan the site sleeps after about 15 minutes without visits and takes around 30 seconds to wake up. Your data is safe in Drive.
- To back up or inspect your data, open `propfirm-data.json` in the Drive folder.
- If the page says it could not load or save, check the three variables and that the folder is shared with the service account as Editor. The Render **Logs** tab shows the exact error.
