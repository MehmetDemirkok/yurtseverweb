#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

/**
 * Veri Arşivleme Sistemi
 * 
 * Bu script eski verileri arşivler ve performansı artırır.
 * Belirli bir tarihten eski verileri ayrı tablolara taşır.
 */

class DataArchiver {
  constructor() {
    this.prisma = new PrismaClient();
    this.archiveDir = path.join(process.cwd(), 'archives');
    this.logDir = path.join(process.cwd(), 'logs');
    
    // Arşivleme konfigürasyonu
    this.archiveConfig = {
      logs: {
        daysOld: 90, // 90 günden eski loglar
        batchSize: 1000,
        archiveTable: 'logs_archive'
      },
      accommodations: {
        daysOld: 365, // 1 yıldan eski konaklamalar
        batchSize: 500,
        archiveTable: 'accommodations_archive'
      },
      transfers: {
        daysOld: 180, // 6 aydan eski transferler
        batchSize: 500,
        archiveTable: 'transfers_archive'
      },
      aracBakimlar: {
        daysOld: 730, // 2 yıldan eski bakım kayıtları
        batchSize: 200,
        archiveTable: 'arac_bakimlar_archive'
      }
    };
  }

  /**
   * Gerekli dizinleri oluştur
   */
  createDirectories() {
    [this.archiveDir, this.logDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Log dosyasına yaz
   */
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    // Log dizinini oluştur
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    const logFile = path.join(this.logDir, `archiver-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, logMessage);
    console.log(logMessage.trim());
  }

  /**
   * Arşiv tablolarını oluştur
   */
  async createArchiveTables() {
    try {
      this.log('Arşiv tabloları oluşturuluyor...');

      // Logs arşiv tablosu
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS logs_archive (
          LIKE logs INCLUDING ALL
        )
      `;

      // Accommodations arşiv tablosu
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS accommodations_archive (
          LIKE accommodations INCLUDING ALL
        )
      `;

      // Transfers arşiv tablosu
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS transfers_archive (
          LIKE transfers INCLUDING ALL
        )
      `;

      // Arac bakımları arşiv tablosu
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS arac_bakimlar_archive (
          LIKE arac_bakimlar INCLUDING ALL
        )
      `;

      this.log('Arşiv tabloları başarıyla oluşturuldu.');
    } catch (error) {
      this.log(`Arşiv tabloları oluşturulurken hata: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Logları arşivle
   */
  async archiveLogs() {
    try {
      this.log('Log arşivleme işlemi başlatılıyor...');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.archiveConfig.logs.daysOld);

      let archivedCount = 0;
      let deletedCount = 0;

      while (true) {
        // Eski logları bul
        const oldLogs = await this.prisma.log.findMany({
          where: {
            createdAt: {
              lt: cutoffDate
            }
          },
          take: this.archiveConfig.logs.batchSize,
          orderBy: {
            createdAt: 'asc'
          }
        });

        if (oldLogs.length === 0) {
          break;
        }

        // Logları arşiv tablosuna kopyala
        for (const log of oldLogs) {
          await this.prisma.$executeRaw`
            INSERT INTO logs_archive SELECT * FROM logs WHERE id = ${log.id}
          `;
        }

        // Orijinal logları sil
        await this.prisma.log.deleteMany({
          where: {
            id: {
              in: oldLogs.map(log => log.id)
            }
          }
        });

        archivedCount += oldLogs.length;
        deletedCount += oldLogs.length;

        this.log(`${oldLogs.length} log arşivlendi ve silindi. Toplam: ${archivedCount}`);
      }

      this.log(`Log arşivleme tamamlandı. Toplam ${archivedCount} kayıt arşivlendi.`);
      return { archived: archivedCount, deleted: deletedCount };
    } catch (error) {
      this.log(`Log arşivleme hatası: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Konaklamaları arşivle
   */
  async archiveAccommodations() {
    try {
      this.log('Konaklama arşivleme işlemi başlatılıyor...');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.archiveConfig.accommodations.daysOld);

      let archivedCount = 0;

      while (true) {
        // Eski konaklamaları bul (giriş tarihi bazında)
        const oldAccommodations = await this.prisma.accommodation.findMany({
          where: {
            girisTarihi: {
              lt: cutoffDate.toISOString().split('T')[0] // YYYY-MM-DD formatı
            }
          },
          take: this.archiveConfig.accommodations.batchSize,
          orderBy: {
            id: 'asc'
          }
        });

        if (oldAccommodations.length === 0) {
          break;
        }

        // Konaklamaları arşiv tablosuna kopyala
        for (const accommodation of oldAccommodations) {
          await this.prisma.$executeRaw`
            INSERT INTO accommodations_archive SELECT * FROM accommodations WHERE id = ${accommodation.id}
          `;
        }

        // Orijinal konaklamaları sil
        await this.prisma.accommodation.deleteMany({
          where: {
            id: {
              in: oldAccommodations.map(acc => acc.id)
            }
          }
        });

        archivedCount += oldAccommodations.length;

        this.log(`${oldAccommodations.length} konaklama arşivlendi. Toplam: ${archivedCount}`);
      }

      this.log(`Konaklama arşivleme tamamlandı. Toplam ${archivedCount} kayıt arşivlendi.`);
      return { archived: archivedCount };
    } catch (error) {
      this.log(`Konaklama arşivleme hatası: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Transferleri arşivle
   */
  async archiveTransfers() {
    try {
      this.log('Transfer arşivleme işlemi başlatılıyor...');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.archiveConfig.transfers.daysOld);

      let archivedCount = 0;

      while (true) {
        // Eski transferleri bul
        const oldTransfers = await this.prisma.transfer.findMany({
          where: {
            kalkisTarihi: {
              lt: cutoffDate
            }
          },
          take: this.archiveConfig.transfers.batchSize,
          orderBy: {
            kalkisTarihi: 'asc'
          }
        });

        if (oldTransfers.length === 0) {
          break;
        }

        // Transferleri arşiv tablosuna kopyala
        for (const transfer of oldTransfers) {
          await this.prisma.$executeRaw`
            INSERT INTO transfers_archive SELECT * FROM transfers WHERE id = ${transfer.id}
          `;
        }

        // Orijinal transferleri sil
        await this.prisma.transfer.deleteMany({
          where: {
            id: {
              in: oldTransfers.map(transfer => transfer.id)
            }
          }
        });

        archivedCount += oldTransfers.length;

        this.log(`${oldTransfers.length} transfer arşivlendi. Toplam: ${archivedCount}`);
      }

      this.log(`Transfer arşivleme tamamlandı. Toplam ${archivedCount} kayıt arşivlendi.`);
      return { archived: archivedCount };
    } catch (error) {
      this.log(`Transfer arşivleme hatası: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Araç bakımlarını arşivle
   */
  async archiveAracBakimlar() {
    try {
      this.log('Araç bakım arşivleme işlemi başlatılıyor...');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.archiveConfig.aracBakimlar.daysOld);

      let archivedCount = 0;

      while (true) {
        // Eski bakım kayıtlarını bul
        const oldBakimlar = await this.prisma.aracBakim.findMany({
          where: {
            planlananTarih: {
              lt: cutoffDate
            },
            durum: {
              in: ['TAMAMLANDI', 'IPTAL']
            }
          },
          take: this.archiveConfig.aracBakimlar.batchSize,
          orderBy: {
            planlananTarih: 'asc'
          }
        });

        if (oldBakimlar.length === 0) {
          break;
        }

        // Bakım kayıtlarını arşiv tablosuna kopyala
        for (const bakim of oldBakimlar) {
          await this.prisma.$executeRaw`
            INSERT INTO arac_bakimlar_archive SELECT * FROM arac_bakimlar WHERE id = ${bakim.id}
          `;
        }

        // Orijinal bakım kayıtlarını sil
        await this.prisma.aracBakim.deleteMany({
          where: {
            id: {
              in: oldBakimlar.map(bakim => bakim.id)
            }
          }
        });

        archivedCount += oldBakimlar.length;

        this.log(`${oldBakimlar.length} bakım kaydı arşivlendi. Toplam: ${archivedCount}`);
      }

      this.log(`Araç bakım arşivleme tamamlandı. Toplam ${archivedCount} kayıt arşivlendi.`);
      return { archived: archivedCount };
    } catch (error) {
      this.log(`Araç bakım arşivleme hatası: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Arşiv istatistiklerini göster
   */
  async showArchiveStats() {
    try {
      this.log('Arşiv istatistikleri hesaplanıyor...');

      const stats = {};

      // Ana tablo istatistikleri
      stats.logs = await this.prisma.log.count();
      stats.accommodations = await this.prisma.accommodation.count();
      stats.transfers = await this.prisma.transfer.count();
      stats.aracBakimlar = await this.prisma.aracBakim.count();

      // Arşiv tablo istatistikleri
      try {
        const logsArchive = await this.prisma.$queryRaw`SELECT COUNT(*) as count FROM logs_archive`;
        stats.logsArchive = parseInt(logsArchive[0].count);
      } catch {
        stats.logsArchive = 0;
      }

      try {
        const accommodationsArchive = await this.prisma.$queryRaw`SELECT COUNT(*) as count FROM accommodations_archive`;
        stats.accommodationsArchive = parseInt(accommodationsArchive[0].count);
      } catch {
        stats.accommodationsArchive = 0;
      }

      try {
        const transfersArchive = await this.prisma.$queryRaw`SELECT COUNT(*) as count FROM transfers_archive`;
        stats.transfersArchive = parseInt(transfersArchive[0].count);
      } catch {
        stats.transfersArchive = 0;
      }

      try {
        const aracBakimlarArchive = await this.prisma.$queryRaw`SELECT COUNT(*) as count FROM arac_bakimlar_archive`;
        stats.aracBakimlarArchive = parseInt(aracBakimlarArchive[0].count);
      } catch {
        stats.aracBakimlarArchive = 0;
      }

      console.log('\n=== Arşiv İstatistikleri ===');
      console.log(`Loglar: ${stats.logs} aktif, ${stats.logsArchive} arşivde`);
      console.log(`Konaklamalar: ${stats.accommodations} aktif, ${stats.accommodationsArchive} arşivde`);
      console.log(`Transferler: ${stats.transfers} aktif, ${stats.transfersArchive} arşivde`);
      console.log(`Araç Bakımları: ${stats.aracBakimlar} aktif, ${stats.aracBakimlarArchive} arşivde`);

      const totalActive = stats.logs + stats.accommodations + stats.transfers + stats.aracBakimlar;
      const totalArchived = stats.logsArchive + stats.accommodationsArchive + stats.transfersArchive + stats.aracBakimlarArchive;

      console.log(`\nToplam: ${totalActive} aktif kayıt, ${totalArchived} arşivlenmiş kayıt`);
      console.log(`Arşiv oranı: ${((totalArchived / (totalActive + totalArchived)) * 100).toFixed(2)}%`);

      return stats;
    } catch (error) {
      this.log(`İstatistik hesaplama hatası: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Tam arşivleme sürecini çalıştır
   */
  async runFullArchive() {
    try {
      this.log('=== Veri Arşivleme Süreci Başlatılıyor ===');

      // Dizinleri oluştur
      this.createDirectories();

      // Arşiv tablolarını oluştur
      await this.createArchiveTables();

      // Her tablo için arşivleme işlemini çalıştır
      const results = {
        logs: await this.archiveLogs(),
        accommodations: await this.archiveAccommodations(),
        transfers: await this.archiveTransfers(),
        aracBakimlar: await this.archiveAracBakimlar()
      };

      // İstatistikleri göster
      await this.showArchiveStats();

      this.log('=== Arşivleme Süreci Başarıyla Tamamlandı ===');

      return results;
    } catch (error) {
      this.log(`=== Arşivleme Süreci Başarısız ===`, 'ERROR');
      this.log(`Hata: ${error.message}`, 'ERROR');
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Script çalıştırıldığında
if (require.main === module) {
  const archiver = new DataArchiver();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'archive':
      archiver.runFullArchive();
      break;
    case 'stats':
      archiver.showArchiveStats();
      break;
    case 'logs':
      archiver.archiveLogs();
      break;
    case 'accommodations':
      archiver.archiveAccommodations();
      break;
    case 'transfers':
      archiver.archiveTransfers();
      break;
    case 'bakimlar':
      archiver.archiveAracBakimlar();
      break;
    default:
      console.log('Kullanım:');
      console.log('  node data-archiver.js archive        - Tüm verileri arşivle');
      console.log('  node data-archiver.js stats          - İstatistikleri göster');
      console.log('  node data-archiver.js logs           - Sadece logları arşivle');
      console.log('  node data-archiver.js accommodations - Sadece konaklamaları arşivle');
      console.log('  node data-archiver.js transfers      - Sadece transferleri arşivle');
      console.log('  node data-archiver.js bakimlar       - Sadece bakımları arşivle');
      break;
  }
}

module.exports = DataArchiver;
