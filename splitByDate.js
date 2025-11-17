const fs = require('fs');
const path = require('path');

/**
 * JSON dosyalarını tarih bazında ayrı dosyalara böler
 */
function splitJsonByDate() {
  try {
    const dataDir = path.join(__dirname, 'data');
    const dailyDir = path.join(dataDir, 'daily');
    
    // daily klasörünü oluştur (yoksa)
    if (!fs.existsSync(dailyDir)) {
      fs.mkdirSync(dailyDir, { recursive: true });
      console.log('daily klasörü oluşturuldu');
    }

    // 1. prices.json dosyasını işle
    console.log('\n=== prices.json işleniyor ===');
    const pricesPath = path.join(dataDir, 'prices.json');
    if (fs.existsSync(pricesPath)) {
      const pricesData = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
      
      // Tarih bazında grupla
      const pricesByDate = {};
      pricesData.forEach(item => {
        const date = item.Day;
        if (date) {
          if (!pricesByDate[date]) {
            pricesByDate[date] = [];
          }
          pricesByDate[date].push(item);
        }
      });

      // Her tarih için ayrı dosya oluştur
      Object.keys(pricesByDate).forEach(date => {
        const fileName = `prices_${date}.json`;
        const filePath = path.join(dailyDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(pricesByDate[date], null, 2), 'utf8');
      });

      console.log(`${Object.keys(pricesByDate).length} tarih için prices dosyaları oluşturuldu`);
      console.log(`Toplam ${pricesData.length} kayıt işlendi`);
    } else {
      console.log('prices.json dosyası bulunamadı');
    }

    // 2. akd_merged.json dosyasını işle
    console.log('\n=== akd_merged.json işleniyor ===');
    const akdPath = path.join(dataDir, 'akd_merged.json');
    if (fs.existsSync(akdPath)) {
      const akdData = JSON.parse(fs.readFileSync(akdPath, 'utf8'));
      
      // Her tarih için ayrı dosya oluştur
      akdData.forEach(item => {
        const date = item.date;
        if (date) {
          const fileName = `akd_${date}.json`;
          const filePath = path.join(dailyDir, fileName);
          fs.writeFileSync(filePath, JSON.stringify(item, null, 2), 'utf8');
        }
      });

      console.log(`${akdData.length} tarih için akd dosyaları oluşturuldu`);
    } else {
      console.log('akd_merged.json dosyası bulunamadı');
    }

    // 3. takas_merged.json dosyasını işle
    console.log('\n=== takas_merged.json işleniyor ===');
    const takasPath = path.join(dataDir, 'takas_merged.json');
    if (fs.existsSync(takasPath)) {
      const takasData = JSON.parse(fs.readFileSync(takasPath, 'utf8'));
      
      // Her tarih için ayrı dosya oluştur
      takasData.forEach(item => {
        const date = item.date;
        if (date) {
          const fileName = `takas_${date}.json`;
          const filePath = path.join(dailyDir, fileName);
          fs.writeFileSync(filePath, JSON.stringify(item, null, 2), 'utf8');
        }
      });

      console.log(`${takasData.length} tarih için takas dosyaları oluşturuldu`);
    } else {
      console.log('takas_merged.json dosyası bulunamadı');
    }

    // Özet
    console.log('\n=== Özet ===');
    const dailyFiles = fs.readdirSync(dailyDir);
    console.log(`Toplam ${dailyFiles.length} dosya oluşturuldu`);
    console.log(`Dosyalar ${dailyDir} klasörüne kaydedildi`);

  } catch (error) {
    console.error('Hata oluştu:', error);
    process.exit(1);
  }
}

// Script çalıştırıldığında fonksiyonu çağır
if (require.main === module) {
  splitJsonByDate();
}

module.exports = splitJsonByDate;

