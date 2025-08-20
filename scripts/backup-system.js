#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

/**
 * Otomatik Backup Sistemi
 * 
 * Bu script düzenli olarak veritabanı backup'ı alır ve email ile bildirim gönderir.
 * Cron job ile çalıştırılabilir.
 */

class BackupSystem {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.logDir = path.join(process.cwd(), 'logs');
    this.maxBackups = 10; // Maksimum backup sayısı
    this.backupRetentionDays = 30; // Backup saklama süresi (gün)
  }

  /**
   * Gerekli dizinleri oluştur
   */
  createDirectories() {
    [this.backupDir, this.logDir].forEach(dir => {
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
    const logFile = path.join(this.logDir, `backup-${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFileSync(logFile, logMessage);
    console.log(logMessage.trim());
  }

  /**
   * Veritabanı backup'ı al
   */
  async createBackup() {
    try {
      this.log('Backup işlemi başlatılıyor...');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);
      
      // PostgreSQL backup komutu
      const backupCommand = `pg_dump "${process.env.DATABASE_URL}" > "${backupFile}"`;
      execSync(backupCommand, { stdio: 'pipe' });
      
      // Backup dosyasının boyutunu kontrol et
      const stats = fs.statSync(backupFile);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      this.log(`Backup başarıyla oluşturuldu: ${backupFile} (${fileSizeInMB} MB)`);
      
      return {
        success: true,
        file: backupFile,
        size: fileSizeInMB,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.log(`Backup oluşturulurken hata: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Eski backup'ları temizle
   */
  cleanupOldBackups() {
    try {
      this.log('Eski backup dosyaları temizleniyor...');
      
      if (!fs.existsSync(this.backupDir)) {
        return;
      }

      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          mtime: fs.statSync(path.join(this.backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime); // En yeni dosyalar önce

      // Maksimum backup sayısını aşan dosyaları sil
      if (files.length > this.maxBackups) {
        const filesToDelete = files.slice(this.maxBackups);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          this.log(`Eski backup dosyası silindi: ${file.name}`);
        });
      }

      // Belirtilen günden eski dosyaları sil
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.backupRetentionDays);

      files.forEach(file => {
        if (file.mtime < cutoffDate) {
          fs.unlinkSync(file.path);
          this.log(`Eski backup dosyası silindi (${this.backupRetentionDays} günden eski): ${file.name}`);
        }
      });

      this.log('Backup temizleme işlemi tamamlandı.');
    } catch (error) {
      this.log(`Backup temizleme hatası: ${error.message}`, 'ERROR');
    }
  }

  /**
   * Backup durumunu kontrol et
   */
  checkBackupHealth() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return { healthy: false, message: 'Backup dizini bulunamadı' };
      }

      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            mtime: stats.mtime,
            ageInHours: (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60)
          };
        })
        .sort((a, b) => b.mtime - a.mtime);

      if (files.length === 0) {
        return { healthy: false, message: 'Hiç backup dosyası bulunamadı' };
      }

      const latestBackup = files[0];
      const isRecent = latestBackup.ageInHours < 24; // Son 24 saat içinde
      const hasReasonableSize = latestBackup.size > 1024; // En az 1KB

      return {
        healthy: isRecent && hasReasonableSize,
        latestBackup: latestBackup,
        totalBackups: files.length,
        message: isRecent ? 'Backup sistemi sağlıklı' : 'Son backup çok eski'
      };
    } catch (error) {
      return { healthy: false, message: `Backup kontrol hatası: ${error.message}` };
    }
  }

  /**
   * Email bildirimi gönder
   */
  async sendNotification(subject, message, isError = false) {
    // Email konfigürasyonu environment variables'dan alınmalı
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    if (!emailConfig.host || !emailConfig.auth.user) {
      this.log('Email konfigürasyonu eksik, bildirim gönderilmedi', 'WARN');
      return;
    }

    try {
      const transporter = nodemailer.createTransporter(emailConfig);
      
      const mailOptions = {
        from: emailConfig.auth.user,
        to: process.env.BACKUP_NOTIFICATION_EMAIL,
        subject: `[Yurtsever Backup] ${subject}`,
        html: `
          <h2>Yurtsever Konaklama Yönetim Sistemi - Backup Bildirimi</h2>
          <p><strong>Durum:</strong> ${isError ? '❌ HATA' : '✅ BAŞARILI'}</p>
          <p><strong>Zaman:</strong> ${new Date().toLocaleString('tr-TR')}</p>
          <p><strong>Mesaj:</strong> ${message}</p>
          <hr>
          <p><small>Bu email otomatik olarak gönderilmiştir.</small></p>
        `
      };

      await transporter.sendMail(mailOptions);
      this.log('Email bildirimi gönderildi');
    } catch (error) {
      this.log(`Email gönderim hatası: ${error.message}`, 'ERROR');
    }
  }

  /**
   * Tam backup sürecini çalıştır
   */
  async runFullBackup() {
    try {
      this.log('=== Otomatik Backup Süreci Başlatılıyor ===');
      
      // Dizinleri oluştur
      this.createDirectories();
      
      // Backup al
      const backupResult = await this.createBackup();
      
      // Eski backup'ları temizle
      this.cleanupOldBackups();
      
      // Backup sağlığını kontrol et
      const healthCheck = this.checkBackupHealth();
      
      // Başarı bildirimi gönder
      const message = `
        Backup başarıyla tamamlandı.
        Dosya: ${backupResult.file}
        Boyut: ${backupResult.size} MB
        Toplam backup sayısı: ${healthCheck.totalBackups}
        Durum: ${healthCheck.message}
      `;
      
      await this.sendNotification('Backup Başarılı', message);
      
      this.log('=== Backup Süreci Başarıyla Tamamlandı ===');
      
      return {
        success: true,
        backup: backupResult,
        health: healthCheck
      };
    } catch (error) {
      this.log(`=== Backup Süreci Başarısız ===`, 'ERROR');
      this.log(`Hata: ${error.message}`, 'ERROR');
      
      // Hata bildirimi gönder
      await this.sendNotification('Backup Hatası', error.message, true);
      
      throw error;
    }
  }

  /**
   * Backup istatistiklerini göster
   */
  showBackupStats() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        console.log('Backup dizini bulunamadı.');
        return;
      }

      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: (stats.size / (1024 * 1024)).toFixed(2),
            mtime: stats.mtime,
            ageInDays: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24))
          };
        })
        .sort((a, b) => b.mtime - a.mtime);

      console.log('\n=== Backup İstatistikleri ===');
      console.log(`Toplam backup sayısı: ${files.length}`);
      console.log(`Maksimum backup sayısı: ${this.maxBackups}`);
      console.log(`Backup saklama süresi: ${this.backupRetentionDays} gün`);
      
      if (files.length > 0) {
        const totalSize = files.reduce((sum, file) => sum + parseFloat(file.size), 0);
        console.log(`Toplam boyut: ${totalSize.toFixed(2)} MB`);
        console.log(`En son backup: ${files[0].name} (${files[0].ageInDays} gün önce)`);
        
        console.log('\nSon 5 backup:');
        files.slice(0, 5).forEach((file, index) => {
          console.log(`${index + 1}. ${file.name} - ${file.size} MB - ${file.ageInDays} gün önce`);
        });
      }
      
      const healthCheck = this.checkBackupHealth();
      console.log(`\nSistem durumu: ${healthCheck.healthy ? '✅ Sağlıklı' : '❌ Sorunlu'}`);
      console.log(`Durum mesajı: ${healthCheck.message}`);
    } catch (error) {
      console.error('İstatistik gösterilirken hata:', error.message);
    }
  }
}

// Script çalıştırıldığında
if (require.main === module) {
  const backupSystem = new BackupSystem();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      backupSystem.runFullBackup();
      break;
    case 'stats':
      backupSystem.showBackupStats();
      break;
    case 'health':
      const health = backupSystem.checkBackupHealth();
      console.log(JSON.stringify(health, null, 2));
      break;
    default:
      console.log('Kullanım:');
      console.log('  node backup-system.js backup  - Backup al');
      console.log('  node backup-system.js stats   - İstatistikleri göster');
      console.log('  node backup-system.js health  - Sağlık kontrolü');
      break;
  }
}

module.exports = BackupSystem;
