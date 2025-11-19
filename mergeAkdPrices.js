const AkdReader = require('./akdReader');
const fs = require('fs');
const path = require('path');

// BIST50 sembolleri
const BIST50 = [
  "AEFES", "AKBNK", "ALARK", "ARCLK", "ASELS", "ASTOR", "BIMAS", "BRSAN",
  "CCOLA", "CIMSA", "DOAS", "DOHOL", "DSTKF", "EKGYO", "ENKAI", "EREGL",
  "FROTO", "GARAN", "GUBRF", "HALKB", "HEKTS", "ISCTR", "KCHOL", "KONTR",
  "KOZAA", "KOZAL", "KRDMD", "KUYAS", "MAVI", "MGROS", "MIATK", "OYAKC",
  "PETKM", "PGSUS", "SAHOL", "SASA", "SISE", "SOKM", "TAVHL", "TCELL",
  "THYAO", "TKFEN", "TOASO", "TSKB", "TTKOM", "TUPRS", "ULKER", "VAKBN",
  "VESTL", "YKBNK"
];

/**
 * Sayıyı 2 ondalık basamağa yuvarlar
 */
function roundTo2Decimals(num) {
  if (num === null || num === undefined) return num;
  return Math.round(num * 100) / 100;
}

/**
 * CSV satırını parse eder (tırnak içindeki değerleri dikkate alarak)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Son değeri ekle
  if (current) {
    result.push(current.trim());
  }
  
  return result;
}

/**
 * prices.csv dosyasını okur ve tarih-sembol bazında index oluşturur
 */
function loadPrices() {
  const pricesPath = path.join(__dirname, 'prices', 'prices.csv');
  const content = fs.readFileSync(pricesPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Header'ı atla
  const prices = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = parseCSVLine(line);
    if (parts.length < 3) continue;
    
    const symbol = parts[0];
    const priceStr = parts[1];
    const date = parts[2];
    
    if (!symbol || !date) continue;
    
    // Fiyat string'ini parse et (virgülü noktaya çevir ve tırnakları temizle)
    const cleanPriceStr = priceStr.replace(/"/g, '').replace(',', '.');
    const price = parseFloat(cleanPriceStr) || 0;
    
    // Tarih formatını normalize et (YYYY-MM-DD)
    const normalizedDate = date.trim();
    
    if (!prices[normalizedDate]) {
      prices[normalizedDate] = {};
    }
    
    prices[normalizedDate][symbol.trim()] = price;
  }
  
  return prices;
}

/**
 * AKD verilerini prices ile birleştirir
 */
function mergeAkdWithPrices() {
  console.log('AKD dosyaları okunuyor...');
  const akdReader = new AkdReader(path.join(__dirname, 'akd'));
  const akdData = akdReader.readAllFiles();
  
  console.log('Prices dosyası okunuyor...');
  const prices = loadPrices();
  
  console.log('Veriler birleştiriliyor...');
  const mergedData = akdData.map(dayData => {
    const date = dayData.date;
    // Sadece BIST50 hisselerini filtrele
    const holdings = dayData.holdings
      .filter(holding => BIST50.includes(holding.senet))
      .map(holding => {
        const symbol = holding.senet;
        
        // Prices'dan o güne ait kapanış fiyatını al
        const closePrice = prices[date] && prices[date][symbol] 
          ? prices[date][symbol] 
          : null;
        
        // BIST50 için sayıları yuvarla
        const processNumber = (num) => roundTo2Decimals(num);
        
        // Kısa property isimleri
        return {
          s: symbol,
          bq: processNumber(holding.alisMiktar),
          ba: processNumber(holding.alisOrtalama),
          sq: processNumber(holding.satisMiktar),
          sa: processNumber(holding.satisOrtalama),
          n: processNumber(holding.net),
          c: processNumber(holding.maliyet),
          cl: processNumber(closePrice)
        };
      });
    
    return {
      date: date,
      holdings: holdings
    };
  });
  
  // data/monthly klasörünü oluştur
  const monthlyDir = path.join(__dirname, 'data', 'monthly');
  if (!fs.existsSync(monthlyDir)) {
    fs.mkdirSync(monthlyDir, { recursive: true });
  }
  
  // Tüm veriyi tek dosyaya kaydet
  const outputPath = path.join(monthlyDir, 'akd.json');
  fs.writeFileSync(outputPath, JSON.stringify(mergedData), 'utf-8');
  console.log(`✅ Birleştirilmiş veri ${outputPath} dosyasına kaydedildi.`);
  
  // Verileri aylara göre grupla
  const dataByMonth = {};
  mergedData.forEach(dayData => {
    // Tarih string'inden direkt ay bilgisini al (YYYY-MM-DD formatından)
    const dateParts = dayData.date.split('-');
    const year = dateParts[0];
    const month = dateParts[1];
    const monthKey = `${year}-${month}`;
    
    if (!dataByMonth[monthKey]) {
      dataByMonth[monthKey] = [];
    }
    
    dataByMonth[monthKey].push(dayData);
  });
  
  // Her ay için ayrı dosya oluştur
  Object.keys(dataByMonth).forEach(monthKey => {
    const monthFilePath = path.join(monthlyDir, `akd-${monthKey}.json`);
    fs.writeFileSync(monthFilePath, JSON.stringify(dataByMonth[monthKey]), 'utf-8');
    console.log(`📅 ${monthKey} ayı için ${dataByMonth[monthKey].length} günlük veri ${monthFilePath} dosyasına kaydedildi.`);
  });
  
  console.log(`📊 Toplam ${mergedData.length} günlük veri işlendi.`);
  console.log(`📁 ${Object.keys(dataByMonth).length} aylık dosya oluşturuldu.`);
  
  return mergedData;
}

// Script doğrudan çalıştırılırsa
if (require.main === module) {
  mergeAkdWithPrices();
}

module.exports = mergeAkdWithPrices;

