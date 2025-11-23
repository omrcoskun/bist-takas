const express = require('express');
const cors = require('cors');
const path = require('path');
const ExcelReader = require('./excelReader');
const MomentumAnalyzer = require('./momentumAnalyzer');
const AkdReader = require('./akdReader');
const AkdAnalyzer = require('./akdAnalyzer');

const app = express();
const PORT = process.env.PORT || 3000;

// Delist edilmiş hisse sembolleri (ekranlarda gözükmeyecek)
const DELISTED_STOCKS = [
  'APMDLF',
  'GLDTRF',
  'GMSTRF',
  'OPT25F',
  'OPTGYF',
  'QTEMZF',
  'USDTRF',
  'Z30KEF',
  'Z30KPF',
  'ZGOLDF',
  'ZPLIBF',
  'ZPT10F',
  'ZPX30F',
  'ZRE20F',
  'ZTM25F'
];

// Hisse sembolünün delist edilip edilmediğini kontrol et
function isDelisted(senet) {
  return DELISTED_STOCKS.includes(senet.toUpperCase());
}

// Holdings listesinden delist edilmiş hisseleri filtrele
function filterDelistedHoldings(holdings) {
  return holdings.filter(h => !isDelisted(h.senet));
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Veri yükleme - TAKAS
const excelReader = new ExcelReader(path.join(__dirname, 'takas'));
const analyzer = new MomentumAnalyzer();

// Veri yükleme - AKD
const akdReader = new AkdReader(path.join(__dirname, 'akd'));
const akdAnalyzer = new AkdAnalyzer();

let allData = null; // TAKAS verisi
let akdData = null; // AKD verisi
let isLoading = false;
let akdIsLoading = false;

// TAKAS verisini yükle
function loadData() {
  if (isLoading) return;
  
  isLoading = true;
  console.log('TAKAS Excel dosyaları okunuyor...');
  
  try {
    allData = excelReader.readAllFiles();
    analyzer.setData(allData);
    console.log(`TAKAS: ${allData.length} günün verisi yüklendi`);
    isLoading = false;
  } catch (error) {
    console.error('TAKAS veri yükleme hatası:', error);
    isLoading = false;
  }
}

// AKD verisini yükle
function loadAkdData() {
  if (akdIsLoading) return;
  
  akdIsLoading = true;
  console.log('AKD Excel dosyaları okunuyor...');
  
  try {
    akdData = akdReader.readAllFiles();
    akdAnalyzer.setData(akdData);
    console.log(`AKD: ${akdData.length} günün verisi yüklendi`);
    akdIsLoading = false;
  } catch (error) {
    console.error('AKD veri yükleme hatası:', error);
    akdIsLoading = false;
  }
}

// İlk yükleme
loadData();
loadAkdData();

// API Endpoints

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tüm verileri döndür
app.get('/api/data', (req, res) => {
  if (!allData) {
    return res.status(503).json({ error: 'Veri henüz yüklenmedi' });
  }
  res.json({
    days: allData.length,
    dates: allData.map(d => d.date),
    data: allData
  });
});

// Belirli bir hisse için momentum verisi
app.get('/api/stock/:senet', (req, res) => {
  if (!allData) {
    return res.status(503).json({ error: 'Veri henüz yüklenmedi' });
  }

  const senet = req.params.senet.toUpperCase();
  const momentum = analyzer.getStockMomentum(senet);
  
  if (momentum.length === 0) {
    return res.status(404).json({ error: 'Hisse bulunamadı' });
  }

  const analysis = analyzer.analyzeMomentumTrend(momentum);
  
  res.json({
    senet,
    momentum,
    analysis
  });
});

// En çok momentum gösteren hisseler
app.get('/api/top-momentum', (req, res) => {
  if (!allData) {
    return res.status(503).json({ error: 'Veri henüz yüklenmedi' });
  }

  const lookBackDays = parseInt(req.query.days) || 20;
  const minDataPoints = parseInt(req.query.minPoints) || 10;
  const limit = parseInt(req.query.limit) || 20;

  let topStocks = analyzer.getTopMomentumStocks(minDataPoints, lookBackDays);
  
  // Delist edilmiş hisseleri filtrele
  topStocks = topStocks.filter(s => !isDelisted(s.senet));
  
  res.json({
    lookBackDays,
    topStocks: topStocks.slice(0, limit),
    total: topStocks.length
  });
});

// Tüm hisseler listesi
app.get('/api/stocks', (req, res) => {
  if (!allData) {
    return res.status(503).json({ error: 'Veri henüz yüklenmedi' });
  }

  const allStocks = new Set();
  for (const dayData of allData) {
    for (const holding of dayData.holdings) {
      // Delist edilmiş hisseleri ekleme
      if (!isDelisted(holding.senet)) {
        allStocks.add(holding.senet);
      }
    }
  }

  res.json({
    stocks: Array.from(allStocks).sort(),
    count: allStocks.size
  });
});

// En çok tutulan ilk N hisse (son gün)
app.get('/api/top-holdings', (req, res) => {
  if (!allData) {
    return res.status(503).json({ error: 'Veri henüz yüklenmedi' });
  }

  const limit = parseInt(req.query.limit);
  const lastDay = allData[allData.length - 1];
  
  if (!lastDay) {
    return res.status(404).json({ error: 'Veri bulunamadı' });
  }

  // Tüm holdings sayısını logla
  console.log(`Top holdings endpoint: Toplam ${lastDay.holdings.length} hisse var, limit: ${limit || 'yok'}`);

  // Limit belirtilmişse sadece o kadarını döndür, yoksa tümünü döndür
  let holdings = limit && !isNaN(limit)
    ? lastDay.holdings.slice(0, limit)
    : lastDay.holdings;

  // Delist edilmiş hisseleri filtrele
  holdings = filterDelistedHoldings(holdings);

  console.log(`Döndürülen hisse sayısı: ${holdings.length}`);

  const topHoldings = holdings.map(h => ({
    senet: h.senet,
    lot: h.lot,
    fiyat: h.fiyat,
    tl: h.tl,
    pozisyon: h.pozisyon
  }));

  res.json({
    date: lastDay.date,
    holdings: topHoldings
  });
});

// Veriyi yeniden yükle
app.post('/api/reload', (req, res) => {
  loadData();
  loadAkdData();
  res.json({ message: 'Veriler yeniden yükleniyor...' });
});

// ============ AKD ENDPOINTS ============

// AKD: Tüm verileri döndür
app.get('/api/akd/data', (req, res) => {
  if (!akdData) {
    return res.status(503).json({ error: 'AKD verisi henüz yüklenmedi' });
  }
  res.json({
    days: akdData.length,
    dates: akdData.map(d => d.date),
    data: akdData
  });
});

// AKD: Belirli bir hisse için veri
app.get('/api/akd/stock/:senet', (req, res) => {
  if (!akdData) {
    return res.status(503).json({ error: 'AKD verisi henüz yüklenmedi' });
  }

  const senet = req.params.senet.toUpperCase();
  const stockData = akdAnalyzer.getStockData(senet);
  
  if (stockData.length === 0) {
    return res.status(404).json({ error: 'Hisse bulunamadı' });
  }

  // TAKAS datasından fiyat bilgisini çek
  const stockDataWithPrice = stockData.map(akdDay => {
    // Aynı tarihte TAKAS datasında bu hisseyi bul
    const takasDay = allData ? allData.find(d => d.date === akdDay.date) : null;
    let fiyat = null;
    
    if (takasDay) {
      const takasHolding = takasDay.holdings.find(h => h.senet === senet);
      if (takasHolding) {
        fiyat = takasHolding.fiyat;
      }
    }

    return {
      ...akdDay,
      fiyat: fiyat // TAKAS fiyat bilgisi
    };
  });

  res.json({
    senet,
    data: stockDataWithPrice
  });
});

// AKD: Tüm hisseler listesi
app.get('/api/akd/stocks', (req, res) => {
  if (!akdData) {
    return res.status(503).json({ error: 'AKD verisi henüz yüklenmedi' });
  }

  const allStocks = akdAnalyzer.getAllStocks().filter(s => !isDelisted(s));

  res.json({
    stocks: allStocks,
    count: allStocks.length
  });
});

// AKD: En çok satış yapılan hisseler
app.get('/api/akd/top-sales', (req, res) => {
  if (!akdData) {
    return res.status(503).json({ error: 'AKD verisi henüz yüklenmedi' });
  }

  const limit = parseInt(req.query.limit) || 20;
  const date = req.query.date || null;

  const topStocks = akdAnalyzer.getTopSalesStocks(limit, date);
  
  res.json({
    topStocks,
    total: topStocks.length
  });
});

// AKD: Tüm hisseleri net değere göre sıralayarak döndür
app.get('/api/akd/all-stocks', (req, res) => {
  if (!akdData) {
    return res.status(503).json({ error: 'AKD verisi henüz yüklenmedi' });
  }

  const date = req.query.date || null;
  let allStocks = akdAnalyzer.getAllStocksByNet(date);
  
  // Delist edilmiş hisseleri filtrele
  allStocks = allStocks.filter(s => !isDelisted(s.senet));
  
  res.json({
    stocks: allStocks,
    total: allStocks.length,
    date: date || (akdData.length > 0 ? akdData[akdData.length - 1].date : null)
  });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
  console.log('Veriler yükleniyor, lütfen bekleyin...');
});
