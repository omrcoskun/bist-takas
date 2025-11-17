const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

/**
 * kasım_prices.xlsx dosyasını JSON'a çevirir
 */
function convertPricesToJson() {
  try {
    const filePath = path.join(__dirname, 'prices', 'kasım prices.xlsx');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Dosya bulunamadı: ${filePath}`);
    }

    console.log('Excel dosyası okunuyor...');
    const workbook = XLSX.readFile(filePath);
    
    // İlk sheet'i oku
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Excel'i JSON'a çevir (başlık satırını otomatik algıla)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false, // Tarihleri string olarak al
      defval: null // Boş hücreler için null
    });

    console.log(`${rawData.length} satır okundu`);
    console.log('İlk satır örneği:', rawData[0]);

    // Tarih kolonlarını bul ve formatla
    const processedData = rawData.map((row, index) => {
      const processedRow = { ...row };
      
      // Tüm kolonları kontrol et ve tarih formatını düzelt
      Object.keys(processedRow).forEach(key => {
        const value = processedRow[key];
        
        if (value && typeof value === 'string') {
          // Excel tarih formatlarını kontrol et
          let dateStr = value.trim();
          
          // MM/DD/YY formatını kontrol et (örn: "11/14/25")
          const dateMatchMMDDYY = dateStr.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{2})$/);
          if (dateMatchMMDDYY) {
            const month = dateMatchMMDDYY[1].padStart(2, '0');
            const day = dateMatchMMDDYY[2].padStart(2, '0');
            let year = dateMatchMMDDYY[3];
            // 2 haneli yılı 4 haneliye çevir (50'den küçükse 2000, büyükse 1900)
            year = parseInt(year) < 50 ? `20${year}` : `19${year}`;
            dateStr = `${year}-${month}-${day}`;
            processedRow[key] = dateStr;
          }
          // DD/MM/YYYY veya DD.MM.YYYY formatını kontrol et
          else if (dateStr.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/)) {
            const dateMatch1 = dateStr.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/);
            const day = dateMatch1[1].padStart(2, '0');
            const month = dateMatch1[2].padStart(2, '0');
            const year = dateMatch1[3];
            dateStr = `${year}-${month}-${day}`;
            processedRow[key] = dateStr;
          }
          // YYYY/MM/DD formatını kontrol et
          else if (dateStr.match(/^(\d{4})[\/\.](\d{1,2})[\/\.](\d{1,2})$/)) {
            const dateMatch2 = dateStr.match(/^(\d{4})[\/\.](\d{1,2})[\/\.](\d{1,2})$/);
            const year = dateMatch2[1];
            const month = dateMatch2[2].padStart(2, '0');
            const day = dateMatch2[3].padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
            processedRow[key] = dateStr;
          }
        } else if (value && typeof value === 'number') {
          // Eğer sayı bir tarih serial number ise (Excel'de tarihler sayı olarak saklanır)
          // 1900-01-01'den itibaren gün sayısı
          if (value > 1 && value < 100000) {
            // Excel serial date olabilir
            const excelEpoch = new Date(1900, 0, 1);
            const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              processedRow[key] = `${year}-${month}-${day}`;
            }
          }
        }
      });
      
      return processedRow;
    });

    // data klasörünü oluştur (yoksa)
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('data klasörü oluşturuldu');
    }

    // JSON dosyasına kaydet
    const outputPath = path.join(dataDir, 'prices.json');
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2), 'utf8');
    
    console.log(`\nVeriler ${outputPath} dosyasına kaydedildi`);
    console.log(`Toplam ${processedData.length} satır kaydedildi`);
    
    // İlk birkaç satırı göster
    console.log('\nİlk 3 satır örneği:');
    processedData.slice(0, 3).forEach((row, i) => {
      console.log(`\nSatır ${i + 1}:`, JSON.stringify(row, null, 2));
    });

  } catch (error) {
    console.error('Hata oluştu:', error);
    process.exit(1);
  }
}

// Script çalıştırıldığında fonksiyonu çağır
if (require.main === module) {
  convertPricesToJson();
}

module.exports = convertPricesToJson;

