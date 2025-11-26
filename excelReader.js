const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

/**
 * Excel dosyalarını okur ve takas verilerini döndürür
 */
class ExcelReader {
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
   * Tek bir Excel dosyasını okur ve hisse verilerini döndürür
   */
  readExcelFile(filePath, date) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Excel'i JSON'a çevir
      // range parametresi olmadan tüm satırları oku (başlık satırını filtreleme ile atlayacağız)
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: ['No', 'Senet', 'Lot', 'Fiyat', 'TL', 'YuzdeTL', 'Toplam', 'Yuzde', 'ToplamTL'],
        defval: null // Boş hücreler için null döndür
      });

      // Geçerli hisse verilerini filtrele (No kolonu sayı olanlar)
      // İlk satır başlık olabilir, onu atla
      console.log(`Excel dosyası okunuyor: ${filePath}, Toplam satır: ${data.length}`);
      
      // Önce tüm verileri normalize et
      const normalizedHoldings = data
        .filter(row => {
          // Başlık satırını ve geçersiz satırları filtrele
          // No kolonu sayı olmalı ve Senet kolonu dolu olmalı
          // Ayrıca "No", "Senet" gibi başlık metinlerini de filtrele
          if (!row.No || !row.Senet) return false;
          if (typeof row.No === 'string' && (row.No.toLowerCase() === 'no' || row.No.toLowerCase() === 'sıra')) return false;
          if (typeof row.Senet === 'string' && row.Senet.toLowerCase() === 'senet') return false;
          return typeof row.No === 'number' && row.Senet;
        })
        .map(row => ({
          no: row.No,
          senet: this.normalizeTicker(String(row.Senet).trim()),
          lot: parseFloat(row.Lot) || 0,
          fiyat: parseFloat(row.Fiyat) || 0,
          tl: parseFloat(row.TL) || 0,
          yuzdeTL: parseFloat(row.YuzdeTL) || 0,
          toplam: parseFloat(row.Toplam) || 0,
          yuzde: parseFloat(row.Yuzde) || 0,
          toplamTL: parseFloat(row.ToplamTL) || 0
        }));
      
      // Aynı ticker için verileri birleştir (eski ve yeni isimler aynı ticker'a map edilirse)
      const holdingsMap = new Map();
      normalizedHoldings.forEach(holding => {
        const existing = holdingsMap.get(holding.senet);
        if (existing) {
          // Aynı ticker için verileri birleştir (lot, tl, vb. topla)
          existing.lot += holding.lot;
          existing.tl += holding.tl;
          existing.yuzdeTL += holding.yuzdeTL;
          existing.toplam += holding.toplam;
          existing.yuzde += holding.yuzde;
          existing.toplamTL += holding.toplamTL;
          // Fiyat için ağırlıklı ortalama kullan
          if (holding.lot > 0 && existing.lot > 0) {
            existing.fiyat = (existing.fiyat * existing.lot + holding.fiyat * holding.lot) / (existing.lot + holding.lot);
          }
        } else {
          holdingsMap.set(holding.senet, { ...holding });
        }
      });
      
      const holdings = Array.from(holdingsMap.values())
        .sort((a, b) => {
          // TL değerine göre azalan sıralama (en çok tutulan üstte)
          return b.tl - a.tl;
        })
        .map((holding, index) => ({
          ...holding,
          pozisyon: index + 1 // Sıralama pozisyonu (1 = en çok tutulan)
        }));
      
      console.log(`Filtrelenmiş hisse sayısı: ${holdings.length}`);

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
      console.error(`Excel dosyası okunamadı: ${filePath}`, error.message);
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

module.exports = ExcelReader;
