# Bofa Takas Momentum Analizi

Borsa İstanbul'da işlem yapan **Bofa** aracı kurumunun günlük takas pozisyonlarını analiz eden ve momentum grafikleri oluşturan Node.js uygulaması.

## Özellikler

- 📊 Günlük Excel dosyalarından otomatik veri okuma
- 📈 Her gün için hisselerin pozisyon değişimlerini takip etme
- 🚀 Momentum analizi - hisselerin pozisyon değişimlerini grafikle gösterme
- 📉 En çok momentum gösteren hisseleri bulma
- 🎯 Web arayüzü ile interaktif grafik görselleştirme

## Kurulum

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Uygulamayı başlatın:
```bash
npm start
```

3. Tarayıcınızda açın:
```
http://localhost:3000
```

## Kullanım

### Excel Dosya Yapısı

Uygulama `takas` klasöründeki Excel dosyalarını otomatik olarak okur. Dosya adları tarih formatında olmalıdır:
- Format: `DDMMYYYY.xlsx` (örn: `01082025.xlsx`)
- Excel dosyasında şu sütunlar olmalıdır:
  - No
  - Senet (Hisse kodu)
  - Lot
  - Fiyat
  - TL (Tutar)
  - Diğer sütunlar...

### Web Arayüzü

1. **Hisse Seçimi**: Dropdown menüden bir hisse seçebilir veya "Top Momentum Hisseleri" listesinden tıklayabilirsiniz.

2. **Geriye Bakış Günü**: Analiz edilecek gün sayısını belirleyebilirsiniz (varsayılan: 20 gün).

3. **Grafik**: Seçilen hissenin pozisyon değişimini ve lot bilgisini gösterir.
   - Pozisyon: Düşük sayı = üst sıralarda (en çok tutulan hisseler)
   - Lot: Hissedeki lot miktarı (bin cinsinden)

4. **Top Momentum Hisseleri**: En çok pozisyon iyileştirmesi gösteren hisseler listelenir.

## API Endpoints

- `GET /api/data` - Tüm günlerin verisini döndürür
- `GET /api/stocks` - Tüm hisse listesini döndürür
- `GET /api/stock/:senet` - Belirli bir hisse için momentum verisi
- `GET /api/top-momentum?days=20&limit=20` - En çok momentum gösteren hisseler
- `POST /api/reload` - Veriyi yeniden yükler

## Momentum Analizi

Momentum analizi, bir hissenin takas pozisyonundaki değişimi ölçer:

- **Güçlü Yükseliş**: 3+ pozisyon iyileştirmesi (örn: 15 → 12)
- **Yükseliş**: Pozitif değişim
- **Değişmeyen**: Aynı pozisyonda
- **Düşüş**: Negatif değişim
- **Güçlü Düşüş**: 3+ pozisyon kaybı

## Teknolojiler

- **Node.js** - Backend
- **Express.js** - Web sunucusu
- **xlsx** - Excel dosya okuma
- **Chart.js** - Grafik görselleştirme
- **HTML/CSS/JavaScript** - Web arayüzü

## Dosya Yapısı

```
.
├── server.js              # Express sunucu
├── excelReader.js         # Excel dosya okuma modülü
├── momentumAnalyzer.js    # Momentum analiz modülü
├── package.json           # NPM bağımlılıkları
├── public/
│   └── index.html        # Web arayüzü
└── takas/
    └── *.xlsx            # Excel dosyaları
```

## Notlar

- Excel dosyaları tarih sırasına göre okunur
- Pozisyon numarası 1 = en çok tutulan hisse
- Düşük pozisyon numarası = üst sıralarda (daha iyi)
- Momentum analizi, seçilen gün sayısına göre hesaplanır
