#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { LRUCache } = require('lru-cache');

// Basit cache stats script'i
async function getCacheStats() {
  try {
    const prisma = new PrismaClient();
    
    // Basit cache istatistikleri
    const stats = {
      timestamp: new Date().toISOString(),
      cacheType: 'memory',
      status: 'active'
    };

    await prisma.$disconnect();
    return stats;
  } catch (error) {
    console.error('Cache stats error:', error);
    return { error: error.message };
  }
}

// Script çalıştırıldığında
if (require.main === module) {
  getCacheStats()
    .then(stats => {
      console.log(JSON.stringify(stats, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { getCacheStats };
