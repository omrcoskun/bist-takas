const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * AKD Excel dosyalarını okur ve verilerini döndürür
 */
class AkdReader {
  constructor(folderPath) {
    this.folderPath = folderPath;
    
    // Eski ticker isimlerini yeni isimlere map et
    this.tickerMapping = {
      'KOZAL': 'TRALT',
      'KOZAA': 'TRMET',
      'IPEKE': 'TRENJ'
    };
  }
  
  /**
   * Ticker ismini normalize et (eski isimleri yeni isimlere çevir)
   */
  normalizeTicker(ticker) {
    const upperTicker = ticker.toUpperCase().trim();
    return this.tickerMapping[upperTicker] || upperTicker;
  }

  /**
   * Tarih formatını düzeltir (DDMMYYYY -> Date)
   */
  parseDate(filename) {
    const match = filename.match(/(\d{2})(\d{2})(\d{4})\.xlsx/);
    if (!match) return null;
    
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // JS'de ay 0-11
    const year = parseInt(match[3]);
    
    // Timezone sorununu önlemek için UTC kullan
    return new Date(Date.UTC(year, month, day));
  }

  /**
   * Klasördeki tüm Excel dosyalarını bulur
   */
  getExcelFiles() {
    const files = fs.readdirSync(this.folderPath);
    return files
      .filter(file => file.endsWith('.xlsx') && !file.startsWith('~$'))
      .map(file => ({
        filename: file,
        date: this.parseDate(file),
        path: path.join(this.folderPath, file)
      }))
      .filter(file => file.date !== null)
      .sort((a, b) => a.date - b.date); // Tarihe göre sırala
  }

  /**
   * Tek bir Excel dosyasını okur ve AKD verilerini döndürür
   */
  readExcelFile(filePath, date) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Excel'i JSON'a çevir
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: ['No', 'Senet', 'AlisMiktar', 'AlisOrtalama', 'SatisMiktar', 'SatisOrtalama', 'Toplam', 'Net', 'Maliyet', 'NetYuzde'],
        range: 1 // İlk satırı atla (başlık)
      });

      // Geçerli hisse verilerini filtrele (No kolonu sayı olanlar)
      const normalizedHoldings = data
        .filter(row => row.No && typeof row.No === 'number' && row.Senet)
        .map(row => ({
          no: row.No,
          senet: this.normalizeTicker(String(row.Senet).trim()),
          alisMiktar: parseFloat(row.AlisMiktar) || 0,
          alisOrtalama: parseFloat(row.AlisOrtalama) || 0,
          satisMiktar: parseFloat(row.SatisMiktar) || 0,
          satisOrtalama: parseFloat(row.SatisOrtalama) || 0,
          toplam: parseFloat(row.Toplam) || 0,
          net: parseFloat(row.Net) || 0,
          maliyet: parseFloat(row.Maliyet) || 0,
          netYuzde: parseFloat(row.NetYuzde) || 0
        }));
      
      // Aynı ticker için verileri birleştir (eski ve yeni isimler aynı ticker'a map edilirse)
      const holdingsMap = new Map();
      normalizedHoldings.forEach(holding => {
        const existing = holdingsMap.get(holding.senet);
        if (existing) {
          // Aynı ticker için verileri birleştir
          existing.alisMiktar += holding.alisMiktar;
          existing.satisMiktar += holding.satisMiktar;
          existing.toplam += holding.toplam;
          existing.net += holding.net;
          existing.netYuzde += holding.netYuzde;
          // Ortalamalar için ağırlıklı ortalama
          const totalAlis = existing.alisMiktar + holding.alisMiktar;
          const totalSatis = existing.satisMiktar + holding.satisMiktar;
          if (totalAlis > 0) {
            existing.alisOrtalama = (existing.alisOrtalama * existing.alisMiktar + holding.alisOrtalama * holding.alisMiktar) / totalAlis;
          }
          if (totalSatis > 0) {
            existing.satisOrtalama = (existing.satisOrtalama * existing.satisMiktar + holding.satisOrtalama * holding.satisMiktar) / totalSatis;
          }
          // Maliyet için ağırlıklı ortalama
          const totalMaliyet = existing.toplam + holding.toplam;
          if (totalMaliyet > 0) {
            existing.maliyet = (existing.maliyet * existing.toplam + holding.maliyet * holding.toplam) / totalMaliyet;
          }
        } else {
          holdingsMap.set(holding.senet, { ...holding });
        }
      });
      
      const holdings = Array.from(holdingsMap.values())
        .sort((a, b) => {
          // Satış miktarına göre azalan sıralama (en çok satış üstte)
          return b.satisMiktar - a.satisMiktar;
        })
        .map((holding, index) => ({
          ...holding,
          pozisyon: index + 1 // Sıralama pozisyonu
        }));

      // Tarihi doğrudan string formatında oluştur (timezone sorununu önlemek için)
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      return {
        date: dateStr, // YYYY-MM-DD formatı
        holdings: holdings
      };
    } catch (error) {
      console.error(`AKD Excel dosyası okunamadı: ${filePath}`, error.message);
      return null;
    }
  }

  /**
   * Tüm Excel dosyalarını okur ve verileri döndürür
   */
  readAllFiles() {
    const files = this.getExcelFiles();
    const results = [];

    for (const file of files) {
      const data = this.readExcelFile(file.path, file.date);
      if (data) {
        results.push(data);
      }
    }

    return results;
  }
}

module.exports = AkdReader;
