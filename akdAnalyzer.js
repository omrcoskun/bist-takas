/**
 * AKD verilerinin analizini yapar
 */
class AkdAnalyzer {
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
   * Belirli bir hisse için tüm günlerdeki verileri döndürür
   */
  getStockData(senet) {
    const stockData = [];

    for (const dayData of this.allData) {
      const holding = dayData.holdings.find(h => h.senet === senet);
      if (holding) {
        stockData.push({
          date: dayData.date,
          alisMiktar: holding.alisMiktar,
          alisOrtalama: holding.alisOrtalama,
          satisMiktar: holding.satisMiktar,
          satisOrtalama: holding.satisOrtalama,
          toplam: holding.toplam,
          net: holding.net,
          maliyet: holding.maliyet,
          pozisyon: holding.pozisyon
        });
      }
    }

    return stockData;
  }

  /**
   * Tüm hisseler listesini döndürür
   */
  getAllStocks() {
    const allStocks = new Set();
    
    for (const dayData of this.allData) {
      for (const holding of dayData.holdings) {
        allStocks.add(holding.senet);
      }
    }

    return Array.from(allStocks).sort();
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

  /**
   * En çok satış yapılan hisseleri döndürür
   */
  getTopSalesStocks(limit = 20, date = null) {
    const targetDate = date || (this.allData.length > 0 ? this.allData[this.allData.length - 1].date : null);
    if (!targetDate) return [];
    
    const dayData = this.allData.find(d => d.date === targetDate);
    
    if (!dayData) return [];

    return dayData.holdings
      .slice(0, limit)
      .map(h => ({
        senet: h.senet,
        satisMiktar: h.satisMiktar,
        alisMiktar: h.alisMiktar,
        net: h.net,
        maliyet: h.maliyet,
        pozisyon: h.pozisyon
      }));
  }

  /**
   * Tüm hisseleri net değere göre sıralayarak döndürür (en çok olandan en az olana)
   */
  getAllStocksByNet(date = null) {
    const targetDate = date || (this.allData.length > 0 ? this.allData[this.allData.length - 1].date : null);
    if (!targetDate) return [];
    
    const dayData = this.allData.find(d => d.date === targetDate);
    
    if (!dayData) return [];

    return dayData.holdings
      .map(h => ({
        senet: h.senet,
        satisMiktar: h.satisMiktar,
        alisMiktar: h.alisMiktar,
        net: h.net,
        maliyet: h.maliyet,
        pozisyon: h.pozisyon
      }))
      .sort((a, b) => b.net - a.net); // Net değere göre azalan sıralama
  }
}

module.exports = AkdAnalyzer;
