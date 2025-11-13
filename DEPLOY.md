# Deployment Kılavuzu

Bu uygulamayı public bir platforma host etmek için aşağıdaki adımları takip edebilirsiniz.

## Render.com ile Deployment (Önerilen)

### 1. GitHub'a Yükleyin

Önce projenizi GitHub'a yükleyin:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### 2. Render.com'da Yeni Web Service Oluşturun

1. [Render.com](https://render.com) hesabı oluşturun (ücretsiz)
2. "New +" butonuna tıklayın
3. "Web Service" seçin
4. GitHub repo'nuzu bağlayın
5. Ayarlar:
   - **Name**: `bofa-takas-analyzer` (veya istediğiniz isim)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (ücretsiz)

### 3. Önemli Notlar

- Render.com ücretsiz tier'de uygulamanız sleep mode'a girebilir (ilk istekte uyanır)
- Excel dosyalarınız (`takas/` ve `akd/` klasörleri) repository'de olmalı
- Port otomatik olarak `process.env.PORT`'dan alınır

## Alternatif: Railway.app

Railway.app de benzer şekilde çalışır:

1. [Railway.app](https://railway.app) hesabı oluşturun
2. GitHub repo'nuzu bağlayın
3. Railway otomatik olarak Node.js uygulamanızı algılar
4. `npm install` ve `npm start` komutlarını otomatik çalıştırır

## Alternatif: Vercel

Vercel için `vercel.json` dosyası gerekir (serverless functions için ek yapılandırma gerekebilir).

## Excel Dosyalarını Yükleme

Excel dosyalarınızı (`takas/` ve `akd/` klasörleri) GitHub repository'nize yüklediğinizden emin olun. Bunlar uygulama için gereklidir.

## Ortam Değişkenleri

Şu anda herhangi bir ortam değişkeni gerekmiyor. Gerekirse Render.com dashboard'dan ekleyebilirsiniz.

## URL

Deployment sonrası uygulamanız şu formatta bir URL alacak:
- Render: `https://bofa-takas-analyzer.onrender.com`
- Railway: `https://your-app-name.up.railway.app`

