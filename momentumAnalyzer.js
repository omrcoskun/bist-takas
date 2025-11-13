/**
 * Hisse pozisyonlarının momentumunu analiz eder
 */
class MomentumAnalyzer {
  constructor() {
    this.allData = []; // Tüm günlerin verisi
  }

  /**
   * Tüm günlerin verisini set eder
   */
  setData(allDaysData) {
    this.allData = allDaysData.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  }

  /**
   * Belirli bir hisse için tüm günlerdeki pozisyon değişimini döndürür
   */
  getStockMomentum(senet) {
    const momentum = [];

    for (const dayData of this.allData) {
      const holding = dayData.holdings.find(h => h.senet === senet);
      if (holding) {
        momentum.push({
          date: dayData.date,
          pozisyon: holding.pozisyon,
          lot: holding.lot,
          fiyat: holding.fiyat,
          tl: holding.tl
        });
      }
    }

    return momentum;
  }

  /**
   * Tüm hisseler için momentum verilerini döndürür
   */
  getAllStocksMomentum() {
    // Tüm günlerde görünen tüm hisseleri topla
    const allStocks = new Set();
    
    for (const dayData of this.allData) {
      for (const holding of dayData.holdings) {
        allStocks.add(holding.senet);
      }
    }

    const stocksMomentum = {};
    
    for (const senet of allStocks) {
      stocksMomentum[senet] = this.getStockMomentum(senet);
    }

    return stocksMomentum;
  }

  /**
   * Momentum trendini analiz eder (yükselen, düşen, değişmeyen)
   */
  analyzeMomentumTrend(momentumData, lookBackDays = 20) {
    if (momentumData.length < 2) {
      return {
        trend: 'yetersiz_veri',
        startPozisyon: null,
        endPozisyon: null,
        change: 0,
        isImproving: false
      };
    }

    const recent = momentumData.slice(-lookBackDays);
    if (recent.length < 2) {
      return {
        trend: 'yetersiz_veri',
        startPozisyon: null,
        endPozisyon: null,
        change: 0,
        isImproving: false
      };
    }

    const startPozisyon = recent[0].pozisyon;
    const endPozisyon = recent[recent.length - 1].pozisyon;
    const change = startPozisyon - endPozisyon; // Pozitif = iyileşme (daha üst sıralara çıkmış)

    let trend = 'değişmeyen';
    if (change > 3) {
      trend = 'güçlü_yükseliş';
    } else if (change > 0) {
      trend = 'yükseliş';
    } else if (change < -3) {
      trend = 'güçlü_düşüş';
    } else if (change < 0) {
      trend = 'düşüş';
    }

    return {
      trend,
      startPozisyon,
      endPozisyon,
      change,
      isImproving: change > 0, // Pozisyon numarası düştüyse iyileşiyor demektir
      dataPoints: recent.length
    };
  }

  /**
   * En çok momentum gösteren hisseleri bulur
   */
  getTopMomentumStocks(minDataPoints = 10, lookBackDays = 20) {
    const allMomentum = this.getAllStocksMomentum();
    const analyzed = [];

    for (const [senet, momentumData] of Object.entries(allMomentum)) {
      if (momentumData.length >= minDataPoints) {
        const analysis = this.analyzeMomentumTrend(momentumData, lookBackDays);
        analyzed.push({
          senet,
          ...analysis,
          momentumData
        });
      }
    }

    // İyileşme gösterenlere göre sırala
    return analyzed
      .filter(item => item.isImproving)
      .sort((a, b) => b.change - a.change); // En çok iyileşen en üstte
  }

  /**
   * Belirli bir tarih aralığındaki verileri döndürür
   */
  getDataForDateRange(startDate, endDate) {
    return this.allData.filter(day => {
      const date = new Date(day.date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });
  }
}

module.exports = MomentumAnalyzer;
