#!/usr/bin/env node

/**
 * Check what data we'll have with November 1st, 2025 cutoff
 */

require('dotenv').config();
const { Pool } = require('pg');

const isCloudDB = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.DATABASE_URL.includes('supabase.com')
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

async function checkNovemberCutoff() {
  console.log('📊 Checking data with November 1st, 2025 cutoff...\n');

  try {
    // Current total
    const totalResult = await pool.query('SELECT COUNT(*) FROM posts');
    console.log(`Current total: ${totalResult.rows[0].count} posts\n`);

    // Posts BEFORE 2025-11-01
    const beforeNov = await pool.query(`
      SELECT
        COUNT(*) as count,
        MIN(created_at) as earliest,
        MAX(created_at) as latest
      FROM posts
      WHERE created_at < '2025-11-01'::date
    `);

    console.log(`🗑️  Posts BEFORE 2025-11-01 (will be deleted):`);
    console.log(`  Count: ${beforeNov.rows[0].count}`);
    if (beforeNov.rows[0].count > 0) {
      console.log(`  Range: ${beforeNov.rows[0].earliest} to ${beforeNov.rows[0].latest}`);
    }

    // Posts FROM 2025-11-01 onwards
    const fromNov = await pool.query(`
      SELECT
        COUNT(*) as count,
        MIN(created_at) as earliest,
        MAX(created_at) as latest
      FROM posts
      WHERE created_at >= '2025-11-01'::date
    `);

    console.log(`\n✅ Posts FROM 2025-11-01 onwards (will be kept):`);
    console.log(`  Count: ${fromNov.rows[0].count}`);
    if (fromNov.rows[0].count > 0) {
      console.log(`  Range: ${fromNov.rows[0].earliest} to ${fromNov.rows[0].latest}`);
    }

    // Monthly distribution
    console.log(`\n📅 Distribution by month:`);
    const monthlyResult = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as posts_count
      FROM posts
      WHERE created_at IS NOT NULL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 5
    `);

    monthlyResult.rows.forEach(row => {
      const marker = row.month >= '2025-11' ? '✓' : '✗';
      console.log(`  ${marker} ${row.month}: ${row.posts_count} posts`);
    });

    // Summary
    const toDelete = parseInt(beforeNov.rows[0].count);
    const toKeep = parseInt(fromNov.rows[0].count);
    const total = parseInt(totalResult.rows[0].count);

    console.log(`\n📊 SUMMARY FOR NOVEMBER 1ST CUTOFF:`);
    console.log(`  Current total: ${total}`);
    console.log(`  Will DELETE: ${toDelete} posts (${((toDelete/total)*100).toFixed(1)}%)`);
    console.log(`  Will KEEP: ${toKeep} posts (${((toKeep/total)*100).toFixed(1)}%)`);

    if (toKeep > 0) {
      console.log(`\n💡 Final dataset will have ${toKeep} posts from November-December 2025`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkNovemberCutoff();
