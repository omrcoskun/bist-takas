# GitHub'a Push Adımları

## 1. GitHub'da Repository Oluşturun
- https://github.com/new adresine gidin
- Repository adı: `bofa-takas-analyzer`
- Public seçin
- "Create repository" butonuna tıklayın

## 2. Aşağıdaki Komutları Çalıştırın

Terminalde şu komutları sırayla çalıştırın (YOUR_USERNAME ve REPO_NAME'i değiştirin):

```bash
cd c:\cursor\bist-takas
git remote add origin https://github.com/YOUR_USERNAME/bofa-takas-analyzer.git
git push -u origin main
```

## Örnek:
Eğer GitHub kullanıcı adınız `ahmet123` ve repository adı `bofa-takas-analyzer` ise:

```bash
git remote add origin https://github.com/ahmet123/bofa-takas-analyzer.git
git push -u origin main
```

GitHub kullanıcı adı ve şifreniz istenebilir. Eğer 2FA (iki faktörlü doğrulama) aktifse, Personal Access Token kullanmanız gerekebilir.

## 3. Render.com'da Deploy

GitHub'a push yaptıktan sonra:

1. https://render.com adresine gidin
2. "Get Started for Free" ile kaydolun
3. "New +" → "Web Service" seçin
4. GitHub repository'nizi bağlayın
5. Ayar:
   - Name: `bofa-takas-analyzer`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
6. "Create Web Service" butonuna tıklayın

Deployment 5-10 dakika sürebilir. Sonrasında uygulamanız canlı olacak!


