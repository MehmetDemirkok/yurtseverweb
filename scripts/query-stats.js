#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

// Basit query stats script'i
async function getQueryStats() {
  try {
    const prisma = new PrismaClient();
    
    // Basit query istatistikleri
    const stats = {
      timestamp: new Date().toISOString(),
      totalQueries: 0,
      averageDuration: 0,
      slowQueries: 0,
      status: 'monitoring'
    };

    await prisma.$disconnect();
    return stats;
  } catch (error) {
    console.error('Query stats error:', error);
    return { error: error.message };
  }
}

// Script çalıştırıldığında
if (require.main === module) {
  getQueryStats()
    .then(stats => {
      console.log(JSON.stringify(stats, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { getQueryStats };
