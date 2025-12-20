#!/usr/bin/env node

/**
 * Script to check date distribution of posts
 * Shows how many posts will be affected by cleanup
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

async function checkDateDistribution() {
  console.log('📊 Checking date distribution of posts...\n');

  try {
    // 1. Total posts
    const totalResult = await pool.query('SELECT COUNT(*) FROM posts');
    console.log(`Total posts in database: ${totalResult.rows[0].count}`);

    // 2. Posts with created_at = NULL
    const nullDateResult = await pool.query(
      'SELECT COUNT(*) FROM posts WHERE created_at IS NULL'
    );
    console.log(`Posts with NULL created_at: ${nullDateResult.rows[0].count}`);

    // 3. Date range
    const rangeResult = await pool.query(`
      SELECT
        MIN(created_at) as earliest_post,
        MAX(created_at) as latest_post
      FROM posts
      WHERE created_at IS NOT NULL
    `);
    console.log(`\nDate range:`);
    console.log(`  Earliest: ${rangeResult.rows[0].earliest_post}`);
    console.log(`  Latest: ${rangeResult.rows[0].latest_post}`);

    // 4. Posts BEFORE 2025-10-01
    const beforeOct2025 = await pool.query(`
      SELECT
        COUNT(*) as count,
        MIN(created_at) as earliest,
        MAX(created_at) as latest
      FROM posts
      WHERE created_at < '2025-10-01'::date
    `);

    console.log(`\n🗑️  Posts BEFORE 2025-10-01 (will be deleted):`);
    console.log(`  Count: ${beforeOct2025.rows[0].count}`);
    if (beforeOct2025.rows[0].count > 0) {
      console.log(`  Date range: ${beforeOct2025.rows[0].earliest} to ${beforeOct2025.rows[0].latest}`);
    }

    // 5. Posts FROM 2025-10-01 onwards
    const fromOct2025 = await pool.query(`
      SELECT
        COUNT(*) as count,
        MIN(created_at) as earliest,
        MAX(created_at) as latest
      FROM posts
      WHERE created_at >= '2025-10-01'::date
    `);

    console.log(`\n✅ Posts FROM 2025-10-01 onwards (will be kept):`);
    console.log(`  Count: ${fromOct2025.rows[0].count}`);
    if (fromOct2025.rows[0].count > 0) {
      console.log(`  Date range: ${fromOct2025.rows[0].earliest} to ${fromOct2025.rows[0].latest}`);
    }

    // 6. Distribution by month
    console.log(`\n📅 Distribution by month:`);
    const monthlyResult = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as posts_count
      FROM posts
      WHERE created_at IS NOT NULL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month DESC
    `);

    monthlyResult.rows.forEach(row => {
      const marker = row.month >= '2025-10' ? '✓' : '✗';
      console.log(`  ${marker} ${row.month}: ${row.posts_count} posts`);
    });

    // 7. Summary
    const toDelete = parseInt(beforeOct2025.rows[0].count) + parseInt(nullDateResult.rows[0].count);
    const toKeep = parseInt(fromOct2025.rows[0].count);

    console.log(`\n📊 SUMMARY:`);
    console.log(`  Total posts: ${totalResult.rows[0].count}`);
    console.log(`  Will DELETE: ${toDelete} posts (${((toDelete/totalResult.rows[0].count)*100).toFixed(1)}%)`);
    console.log(`    - Before 2025-10-01: ${beforeOct2025.rows[0].count}`);
    console.log(`    - NULL dates: ${nullDateResult.rows[0].count}`);
    console.log(`  Will KEEP: ${toKeep} posts (${((toKeep/totalResult.rows[0].count)*100).toFixed(1)}%)`);

    if (toDelete > 0) {
      console.log(`\n⚠️  WARNING: This cleanup will DELETE ${toDelete} posts!`);
      console.log(`   Make sure to run backup before proceeding.`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDateDistribution();
