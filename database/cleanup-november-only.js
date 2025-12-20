#!/usr/bin/env node

/**
 * Script to cleanup posts before 2025-11-01
 * Keeps only November and December 2025 posts
 *
 * Usage:
 *   node database/cleanup-november-only.js
 *   node database/cleanup-november-only.js --skip-backup
 *   node database/cleanup-november-only.js --dry-run
 */

require('dotenv').config();
const { Pool } = require('pg');
const { exec } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const skipBackup = args.includes('--skip-backup');
const dryRun = args.includes('--dry-run');

const isCloudDB = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.DATABASE_URL.includes('supabase.com')
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

function makeBackup() {
  return new Promise((resolve, reject) => {
    console.log('📦 Making backup before cleanup...\n');

    const backupScript = path.join(__dirname, 'backup-nodejs.js');
    exec(`node "${backupScript}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backup failed:', error.message);
        reject(error);
        return;
      }

      console.log(stdout);
      console.log('✅ Backup completed successfully!\n');
      resolve();
    });
  });
}

async function performCleanup() {
  console.log('🧹 Starting cleanup process...\n');

  try {
    // Check current state
    const beforeResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at < '2025-11-01'::date) as to_delete,
        COUNT(*) FILTER (WHERE created_at >= '2025-11-01'::date) as to_keep
      FROM posts
    `);

    const { total, to_delete, to_keep } = beforeResult.rows[0];

    console.log('📊 Current state:');
    console.log(`  Total posts: ${total}`);
    console.log(`  Posts to DELETE (before Nov 1): ${to_delete} (${((to_delete/total)*100).toFixed(1)}%)`);
    console.log(`  Posts to KEEP (Nov-Dec): ${to_keep} (${((to_keep/total)*100).toFixed(1)}%)`);

    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes will be made\n');

      // Show October posts that will be deleted
      const octoberResult = await pool.query(`
        SELECT
          TO_CHAR(created_at, 'YYYY-MM-DD') as date,
          COUNT(*) as count
        FROM posts
        WHERE created_at >= '2025-10-01'::date
          AND created_at < '2025-11-01'::date
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date DESC
        LIMIT 10
      `);

      console.log('October 2025 posts that WOULD be deleted (last 10 days):');
      octoberResult.rows.forEach(row => {
        console.log(`  ${row.date}: ${row.count} posts`);
      });

      // Show what will remain
      const remainResult = await pool.query(`
        SELECT
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*) as count
        FROM posts
        WHERE created_at >= '2025-11-01'::date
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month
      `);

      console.log('\nMonths that WILL REMAIN:');
      remainResult.rows.forEach(row => {
        console.log(`  ✓ ${row.month}: ${row.count} posts`);
      });

      console.log(`\n✅ Dry run completed. Run without --dry-run to actually delete.`);
      return;
    }

    if (to_delete === 0) {
      console.log('\n✅ No posts to delete. Database already has November+ only!');
      return;
    }

    console.log('\n⚠️  WARNING: About to DELETE ' + to_delete + ' posts (including all October)!');
    console.log('   Proceeding in 3 seconds... (Ctrl+C to cancel)\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Execute DELETE
    console.log('🗑️  Deleting posts before 2025-11-01...\n');

    const deleteResult = await pool.query(`
      DELETE FROM posts
      WHERE created_at < '2025-11-01'::date
      RETURNING id
    `);

    console.log(`✅ Deleted ${deleteResult.rowCount} posts\n`);

    // Verify results
    console.log('🔍 Verifying cleanup results...\n');

    const afterResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        MIN(created_at) as earliest,
        MAX(created_at) as latest,
        TO_CHAR(MIN(created_at), 'YYYY-MM') as earliest_month,
        TO_CHAR(MAX(created_at), 'YYYY-MM') as latest_month
      FROM posts
      WHERE created_at IS NOT NULL
    `);

    const after = afterResult.rows[0];

    console.log('📊 After cleanup:');
    console.log(`  Total posts: ${after.total}`);
    console.log(`  Earliest: ${after.earliest}`);
    console.log(`  Latest: ${after.latest}`);
    console.log(`  Month range: ${after.earliest_month} to ${after.latest_month}`);

    // Verify earliest is >= 2025-11-01
    const earliestDate = new Date(after.earliest);
    const cutoffDate = new Date('2025-11-01');

    if (earliestDate >= cutoffDate) {
      console.log('\n✅ SUCCESS! All posts are now from November 2025 onwards');
    } else {
      console.log('\n⚠️  WARNING: Some posts before November 2025 still remain!');
    }

    // Monthly breakdown
    const monthlyResult = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as count,
        ROUND(COUNT(*)::numeric / ${after.total} * 100, 1) as percentage
      FROM posts
      WHERE created_at IS NOT NULL
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
    `);

    console.log('\n📅 Final monthly distribution:');
    monthlyResult.rows.forEach(row => {
      console.log(`  ${row.month}: ${row.count} posts (${row.percentage}%)`);
    });

    console.log('\n🎉 Cleanup completed successfully!\n');

    // Summary
    console.log('📝 SUMMARY:');
    console.log(`  Before: ${total} posts`);
    console.log(`  Deleted: ${deleteResult.rowCount} posts (October + earlier)`);
    console.log(`  After: ${after.total} posts (November + December only)`);
    console.log(`  Reduction: ${((deleteResult.rowCount/total)*100).toFixed(1)}%`);

    if (!skipBackup) {
      console.log('\n💡 Backup is available in database/backups/ if you need to restore');
    }

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    console.error('\n⚠️  Database may be in inconsistent state!');
    console.error('💡 Restore from backup if needed:');
    console.error('   psql "$DATABASE_URL" < database/backups/[latest-backup].sql');
    throw error;
  }
}

async function main() {
  try {
    console.log('🧹 NOVEMBER-ONLY CLEANUP SCRIPT');
    console.log('━'.repeat(50));
    console.log('Target: Keep only November-December 2025 posts');
    console.log('        Delete all posts before 2025-11-01');
    console.log('━'.repeat(50) + '\n');

    if (!skipBackup && !dryRun) {
      await makeBackup();
    } else if (skipBackup) {
      console.log('⚠️  Backup skipped (--skip-backup flag)\n');
    } else if (dryRun) {
      console.log('ℹ️  Backup skipped in dry-run mode\n');
    }

    await performCleanup();

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
