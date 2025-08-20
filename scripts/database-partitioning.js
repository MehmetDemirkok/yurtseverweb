#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

/**
 * Database Partitioning Sistemi
 * 
 * Büyük tablolar için partitioning stratejisi.
 * Özellikle log tabloları ve büyük veri tabloları için.
 */

class DatabasePartitioning {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Log tablosu için partitioning oluştur
   */
  async createLogPartitions() {
    try {
      console.log('Log tablosu için partitioning oluşturuluyor...');

      // Log tablosu için range partitioning (ay bazında)
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS logs_partitioned (
          LIKE logs INCLUDING ALL
        ) PARTITION BY RANGE (created_at);
      `;

      // Son 12 ay için partition'lar oluştur
      const currentDate = new Date();
      for (let i = 0; i < 12; i++) {
        const partitionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const nextMonth = new Date(partitionDate.getFullYear(), partitionDate.getMonth() + 1, 1);
        
        const partitionName = `logs_${partitionDate.getFullYear()}_${String(partitionDate.getMonth() + 1).padStart(2, '0')}`;
        const startDate = partitionDate.toISOString().split('T')[0];
        const endDate = nextMonth.toISOString().split('T')[0];

        await this.prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS ${partitionName} 
          PARTITION OF logs_partitioned 
          FOR VALUES FROM ('${startDate}') TO ('${endDate}');
        `;

        console.log(`Partition oluşturuldu: ${partitionName}`);
      }

      // Gelecek ay için partition
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      const nextMonthName = `logs_${nextMonth.getFullYear()}_${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
      const nextMonthStart = nextMonth.toISOString().split('T')[0];
      const nextMonthEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 1).toISOString().split('T')[0];

      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS ${nextMonthName} 
        PARTITION OF logs_partitioned 
        FOR VALUES FROM ('${nextMonthStart}') TO ('${nextMonthEnd}');
      `;

      console.log('Log partitioning başarıyla tamamlandı.');
    } catch (error) {
      console.error('Log partitioning hatası:', error);
      throw error;
    }
  }

  /**
   * Accommodation tablosu için partitioning oluştur
   */
  async createAccommodationPartitions() {
    try {
      console.log('Accommodation tablosu için partitioning oluşturuluyor...');

      // Accommodation tablosu için hash partitioning (company_id bazında)
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS accommodations_partitioned (
          LIKE accommodations INCLUDING ALL
        ) PARTITION BY HASH (company_id);
      `;

      // 8 partition oluştur (hash partitioning için)
      for (let i = 0; i < 8; i++) {
        const partitionName = `accommodations_part_${i}`;
        
        await this.prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS ${partitionName} 
          PARTITION OF accommodations_partitioned 
          FOR VALUES WITH (modulus 8, remainder ${i});
        `;

        console.log(`Partition oluşturuldu: ${partitionName}`);
      }

      console.log('Accommodation partitioning başarıyla tamamlandı.');
    } catch (error) {
      console.error('Accommodation partitioning hatası:', error);
      throw error;
    }
  }

  /**
   * Transfer tablosu için partitioning oluştur
   */
  async createTransferPartitions() {
    try {
      console.log('Transfer tablosu için partitioning oluşturuluyor...');

      // Transfer tablosu için range partitioning (tarih bazında)
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS transfers_partitioned (
          LIKE transfers INCLUDING ALL
        ) PARTITION BY RANGE (kalkis_tarihi);
      `;

      // Son 6 ay için partition'lar oluştur
      const currentDate = new Date();
      for (let i = 0; i < 6; i++) {
        const partitionDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const nextMonth = new Date(partitionDate.getFullYear(), partitionDate.getMonth() + 1, 1);
        
        const partitionName = `transfers_${partitionDate.getFullYear()}_${String(partitionDate.getMonth() + 1).padStart(2, '0')}`;
        const startDate = partitionDate.toISOString().split('T')[0];
        const endDate = nextMonth.toISOString().split('T')[0];

        await this.prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS ${partitionName} 
          PARTITION OF transfers_partitioned 
          FOR VALUES FROM ('${startDate}') TO ('${endDate}');
        `;

        console.log(`Partition oluşturuldu: ${partitionName}`);
      }

      console.log('Transfer partitioning başarıyla tamamlandı.');
    } catch (error) {
      console.error('Transfer partitioning hatası:', error);
      throw error;
    }
  }

  /**
   * Partition istatistikleri
   */
  async getPartitionStats() {
    try {
      console.log('Partition istatistikleri alınıyor...');

      const stats = {};

      // Log partition istatistikleri
      const logPartitions = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE tablename LIKE 'logs_%' 
        ORDER BY tablename;
      `;
      stats.logs = logPartitions;

      // Accommodation partition istatistikleri
      const accommodationPartitions = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE tablename LIKE 'accommodations_part_%' 
        ORDER BY tablename;
      `;
      stats.accommodations = accommodationPartitions;

      // Transfer partition istatistikleri
      const transferPartitions = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE tablename LIKE 'transfers_%' 
        ORDER BY tablename;
      `;
      stats.transfers = transferPartitions;

      // Partition boyutları
      const partitionSizes = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE tablename LIKE '%partition%' 
        ORDER BY size_bytes DESC;
      `;
      stats.sizes = partitionSizes;

      return stats;
    } catch (error) {
      console.error('Partition istatistikleri hatası:', error);
      throw error;
    }
  }

  /**
   * Eski partition'ları temizle
   */
  async cleanupOldPartitions() {
    try {
      console.log('Eski partition\'lar temizleniyor...');

      // 1 yıldan eski log partition'larını sil
      const currentDate = new Date();
      const oneYearAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
      
      const oldLogPartitions = await this.prisma.$queryRaw`
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'logs_%' 
        AND tablename < 'logs_${oneYearAgo.getFullYear()}_${String(oneYearAgo.getMonth() + 1).padStart(2, '0')}';
      `;

      for (const partition of oldLogPartitions) {
        await this.prisma.$executeRaw`DROP TABLE IF EXISTS ${partition.tablename};`;
        console.log(`Eski partition silindi: ${partition.tablename}`);
      }

      // 6 aydan eski transfer partition'larını sil
      const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
      
      const oldTransferPartitions = await this.prisma.$queryRaw`
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'transfers_%' 
        AND tablename < 'transfers_${sixMonthsAgo.getFullYear()}_${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}';
      `;

      for (const partition of oldTransferPartitions) {
        await this.prisma.$executeRaw`DROP TABLE IF EXISTS ${partition.tablename};`;
        console.log(`Eski partition silindi: ${partition.tablename}`);
      }

      console.log('Eski partition\'lar başarıyla temizlendi.');
    } catch (error) {
      console.error('Partition temizleme hatası:', error);
      throw error;
    }
  }

  /**
   * Yeni partition'ları otomatik oluştur
   */
  async createMonthlyPartitions() {
    try {
      console.log('Aylık partition\'lar oluşturuluyor...');

      const currentDate = new Date();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      
      // Log partition'ı
      const logPartitionName = `logs_${nextMonth.getFullYear()}_${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
      const logStartDate = nextMonth.toISOString().split('T')[0];
      const logEndDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 1).toISOString().split('T')[0];

      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS ${logPartitionName} 
        PARTITION OF logs_partitioned 
        FOR VALUES FROM ('${logStartDate}') TO ('${logEndDate}');
      `;

      // Transfer partition'ı
      const transferPartitionName = `transfers_${nextMonth.getFullYear()}_${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
      
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS ${transferPartitionName} 
        PARTITION OF transfers_partitioned 
        FOR VALUES FROM ('${logStartDate}') TO ('${logEndDate}');
      `;

      console.log(`Yeni partition'lar oluşturuldu: ${logPartitionName}, ${transferPartitionName}`);
    } catch (error) {
      console.error('Aylık partition oluşturma hatası:', error);
      throw error;
    }
  }

  /**
   * Partition performans analizi
   */
  async analyzePartitionPerformance() {
    try {
      console.log('Partition performans analizi yapılıyor...');

      const analysis = {};

      // Query performans analizi
      const queryPerformance = await this.prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE query LIKE '%partition%' 
        ORDER BY total_time DESC 
        LIMIT 10;
      `;
      analysis.queryPerformance = queryPerformance;

      // Index kullanım analizi
      const indexUsage = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE tablename LIKE '%partition%' 
        ORDER BY idx_scan DESC;
      `;
      analysis.indexUsage = indexUsage;

      // Table access analizi
      const tableAccess = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch
        FROM pg_stat_user_tables 
        WHERE tablename LIKE '%partition%' 
        ORDER BY seq_scan DESC;
      `;
      analysis.tableAccess = tableAccess;

      return analysis;
    } catch (error) {
      console.error('Performans analizi hatası:', error);
      throw error;
    }
  }

  /**
   * Tam partitioning sürecini çalıştır
   */
  async runFullPartitioning() {
    try {
      console.log('=== Database Partitioning Süreci Başlatılıyor ===');

      // 1. Log partitioning
      await this.createLogPartitions();

      // 2. Accommodation partitioning
      await this.createAccommodationPartitions();

      // 3. Transfer partitioning
      await this.createTransferPartitions();

      // 4. Eski partition'ları temizle
      await this.cleanupOldPartitions();

      // 5. İstatistikleri al
      const stats = await this.getPartitionStats();

      console.log('=== Partitioning Süreci Başarıyla Tamamlandı ===');
      console.log('İstatistikler:', JSON.stringify(stats, null, 2));

      return stats;
    } catch (error) {
      console.error('=== Partitioning Süreci Başarısız ===');
      console.error('Hata:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Script çalıştırıldığında
if (require.main === module) {
  const partitioning = new DatabasePartitioning();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      partitioning.runFullPartitioning();
      break;
    case 'stats':
      partitioning.getPartitionStats().then(console.log);
      break;
    case 'cleanup':
      partitioning.cleanupOldPartitions();
      break;
    case 'monthly':
      partitioning.createMonthlyPartitions();
      break;
    case 'performance':
      partitioning.analyzePartitionPerformance().then(console.log);
      break;
    default:
      console.log('Kullanım:');
      console.log('  node database-partitioning.js create      - Tüm partition\'ları oluştur');
      console.log('  node database-partitioning.js stats       - Partition istatistikleri');
      console.log('  node database-partitioning.js cleanup     - Eski partition\'ları temizle');
      console.log('  node database-partitioning.js monthly     - Aylık partition\'ları oluştur');
      console.log('  node database-partitioning.js performance - Performans analizi');
      break;
  }
}

module.exports = DatabasePartitioning;
