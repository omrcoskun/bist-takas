const fs = require('fs');
const path = require('path');

/**
 * Daily klasöründeki dosyaları ay bazında birleştirir
 */
function createMonthlyFiles() {
  try {
    const dataDir = path.join(__dirname, 'data');
    const dailyDir = path.join(dataDir, 'daily');
    const monthlyDir = path.join(dataDir, 'monthly');
    
    // monthly klasörünü oluştur (yoksa)
    if (!fs.existsSync(monthlyDir)) {
      fs.mkdirSync(monthlyDir, { recursive: true });
      console.log('monthly klasörü oluşturuldu');
    }

    if (!fs.existsSync(dailyDir)) {
      throw new Error('daily klasörü bulunamadı');
    }

    const dailyFiles = fs.readdirSync(dailyDir).filter(file => file.endsWith('.json'));

    // Dosyaları tipe göre grupla
    const filesByType = {
      prices: [],
      akd: [],
      takas: []
    };

    dailyFiles.forEach(file => {
      if (file.startsWith('prices_')) {
        filesByType.prices.push(file);
      } else if (file.startsWith('akd_')) {
        filesByType.akd.push(file);
      } else if (file.startsWith('takas_')) {
        filesByType.takas.push(file);
      }
    });

    // 1. Prices dosyalarını ay bazında birleştir
    console.log('\n=== Prices dosyaları işleniyor ===');
    const pricesByMonth = {};
    
    // Önce daily klasöründeki prices dosyalarını kontrol et
    if (filesByType.prices.length > 0) {
      filesByType.prices.forEach(file => {
        const match = file.match(/prices_(\d{4})-(\d{2})-\d{2}\.json/);
        if (match) {
          const year = match[1];
          const month = match[2];
          const monthKey = `${year}-${month}`;
          
          if (!pricesByMonth[monthKey]) {
            pricesByMonth[monthKey] = [];
          }
          
          const filePath = path.join(dailyDir, file);
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          pricesByMonth[monthKey].push(...fileData);
        }
      });
    }
    
    // Eğer daily'de yoksa, ana prices.json dosyasından oluştur
    if (Object.keys(pricesByMonth).length === 0) {
      const pricesPath = path.join(dataDir, 'prices.json');
      if (fs.existsSync(pricesPath)) {
        console.log('prices.json dosyasından ay bazında oluşturuluyor...');
        const pricesData = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
        
        pricesData.forEach(item => {
          if (item.Day) {
            const match = item.Day.match(/^(\d{4})-(\d{2})-\d{2}$/);
            if (match) {
              const year = match[1];
              const month = match[2];
              const monthKey = `${year}-${month}`;
              
              if (!pricesByMonth[monthKey]) {
                pricesByMonth[monthKey] = [];
              }
              
              pricesByMonth[monthKey].push(item);
            }
          }
        });
      }
    }

    // Her ay için dosya oluştur
    if (Object.keys(pricesByMonth).length > 0) {
      Object.keys(pricesByMonth).forEach(monthKey => {
        const fileName = `prices_${monthKey}.json`;
        const filePath = path.join(monthlyDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(pricesByMonth[monthKey], null, 2), 'utf8');
        console.log(`${fileName} oluşturuldu (${pricesByMonth[monthKey].length} kayıt)`);
      });
    } else {
      console.log('Prices verisi bulunamadı');
    }

    // 2. AKD dosyalarını ay bazında birleştir
    console.log('\n=== AKD dosyaları işleniyor ===');
    if (filesByType.akd.length > 0) {
      const akdByMonth = {};
      
      filesByType.akd.forEach(file => {
        const match = file.match(/akd_(\d{4})-(\d{2})-\d{2}\.json/);
        if (match) {
          const year = match[1];
          const month = match[2];
          const monthKey = `${year}-${month}`;
          
          if (!akdByMonth[monthKey]) {
            akdByMonth[monthKey] = [];
          }
          
          const filePath = path.join(dailyDir, file);
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          akdByMonth[monthKey].push(fileData);
        }
      });

      // Her ay için dosya oluştur
      Object.keys(akdByMonth).forEach(monthKey => {
        const fileName = `akd_${monthKey}.json`;
        const filePath = path.join(monthlyDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(akdByMonth[monthKey], null, 2), 'utf8');
        console.log(`${fileName} oluşturuldu (${akdByMonth[monthKey].length} gün)`);
      });
    } else {
      console.log('AKD dosyası bulunamadı');
    }

    // 3. Takas dosyalarını ay bazında birleştir
    console.log('\n=== Takas dosyaları işleniyor ===');
    if (filesByType.takas.length > 0) {
      const takasByMonth = {};
      
      filesByType.takas.forEach(file => {
        const match = file.match(/takas_(\d{4})-(\d{2})-\d{2}\.json/);
        if (match) {
          const year = match[1];
          const month = match[2];
          const monthKey = `${year}-${month}`;
          
          if (!takasByMonth[monthKey]) {
            takasByMonth[monthKey] = [];
          }
          
          const filePath = path.join(dailyDir, file);
          const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          takasByMonth[monthKey].push(fileData);
        }
      });

      // Her ay için dosya oluştur
      Object.keys(takasByMonth).forEach(monthKey => {
        const fileName = `takas_${monthKey}.json`;
        const filePath = path.join(monthlyDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(takasByMonth[monthKey], null, 2), 'utf8');
        console.log(`${fileName} oluşturuldu (${takasByMonth[monthKey].length} gün)`);
      });
    } else {
      console.log('Takas dosyası bulunamadı');
    }

    // Özet
    console.log('\n=== Özet ===');
    const monthlyFiles = fs.readdirSync(monthlyDir);
    console.log(`Toplam ${monthlyFiles.length} aylık dosya oluşturuldu`);
    console.log(`Dosyalar ${monthlyDir} klasörüne kaydedildi`);

  } catch (error) {
    console.error('Hata oluştu:', error);
    process.exit(1);
  }
}

// Script çalıştırıldığında fonksiyonu çağır
if (require.main === module) {
  createMonthlyFiles();
}

module.exports = createMonthlyFiles;

