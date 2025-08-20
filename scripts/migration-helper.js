#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Güvenli Migration Helper
 * 
 * Bu script migration'ları güvenli bir şekilde çalıştırmak için kullanılır.
 * Production ortamında migration çalıştırmadan önce backup alır.
 */

class MigrationHelper {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.backupDir = path.join(process.cwd(), 'backups');
    this.migrationDir = path.join(process.cwd(), 'prisma', 'migrations');
  }

  /**
   * Backup dizinini oluştur
   */
  createBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Veritabanı backup'ı al
   */
  async createBackup() {
    if (!this.isProduction) {
      console.log('Development ortamında backup atlanıyor...');
      return;
    }

    this.createBackupDir();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);
    
    try {
      console.log('Veritabanı backup\'ı alınıyor...');
      
      // PostgreSQL backup komutu
      const backupCommand = `pg_dump "${process.env.DATABASE_URL}" > "${backupFile}"`;
      execSync(backupCommand, { stdio: 'inherit' });
      
      console.log(`Backup başarıyla oluşturuldu: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('Backup oluşturulurken hata:', error.message);
      throw error;
    }
  }

  /**
   * Migration'ları kontrol et
   */
  checkMigrations() {
    try {
      console.log('Migration\'lar kontrol ediliyor...');
      
      // Migration durumunu kontrol et
      execSync('npx prisma migrate status', { stdio: 'inherit' });
      
      console.log('Migration durumu kontrol edildi.');
    } catch (error) {
      console.error('Migration kontrolünde hata:', error.message);
      throw error;
    }
  }

  /**
   * Migration'ları güvenli şekilde çalıştır
   */
  async runMigrations() {
    try {
      console.log('Migration\'lar başlatılıyor...');
      
      // Production'da backup al
      if (this.isProduction) {
        await this.createBackup();
      }
      
      // Migration'ları çalıştır
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      
      console.log('Migration\'lar başarıyla tamamlandı.');
    } catch (error) {
      console.error('Migration çalıştırılırken hata:', error.message);
      
      if (this.isProduction) {
        console.log('Production ortamında hata oluştu. Backup dosyasını kontrol edin.');
      }
      
      throw error;
    }
  }

  /**
   * Prisma client'ı generate et
   */
  generateClient() {
    try {
      console.log('Prisma client generate ediliyor...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('Prisma client başarıyla generate edildi.');
    } catch (error) {
      console.error('Client generate edilirken hata:', error.message);
      throw error;
    }
  }

  /**
   * Veritabanı şemasını validate et
   */
  validateSchema() {
    try {
      console.log('Veritabanı şeması validate ediliyor...');
      execSync('npx prisma validate', { stdio: 'inherit' });
      console.log('Şema validation başarılı.');
    } catch (error) {
      console.error('Şema validation hatası:', error.message);
      throw error;
    }
  }

  /**
   * Eski backup dosyalarını temizle (30 günden eski)
   */
  cleanupOldBackups() {
    if (!fs.existsSync(this.backupDir)) {
      return;
    }

    const files = fs.readdirSync(this.backupDir);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    files.forEach(file => {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`Eski backup dosyası silindi: ${file}`);
      }
    });
  }

  /**
   * Tam migration sürecini çalıştır
   */
  async runFullMigration() {
    try {
      console.log('=== Güvenli Migration Süreci Başlatılıyor ===');
      
      // 1. Şema validation
      this.validateSchema();
      
      // 2. Migration kontrolü
      this.checkMigrations();
      
      // 3. Migration'ları çalıştır
      await this.runMigrations();
      
      // 4. Client generate et
      this.generateClient();
      
      // 5. Eski backup'ları temizle
      this.cleanupOldBackups();
      
      console.log('=== Migration Süreci Başarıyla Tamamlandı ===');
    } catch (error) {
      console.error('=== Migration Süreci Başarısız ===');
      console.error('Hata:', error.message);
      process.exit(1);
    }
  }
}

// Script çalıştırıldığında
if (require.main === module) {
  const helper = new MigrationHelper();
  helper.runFullMigration();
}

module.exports = MigrationHelper;
