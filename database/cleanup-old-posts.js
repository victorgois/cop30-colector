#!/usr/bin/env node

/**
 * Script to cleanup posts before 2025-10-01
 *
 * Steps:
 * 1. Make backup
 * 2. Delete posts with created_at < 2025-10-01
 * 3. Verify results
 *
 * Usage:
 *   node database/cleanup-old-posts.js
 *   node database/cleanup-old-posts.js --skip-backup  (not recommended)
 *   node database/cleanup-old-posts.js --dry-run      (show what would be deleted)
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

// Função para fazer backup
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

// Função para executar cleanup
async function performCleanup() {
  console.log('🧹 Starting cleanup process...\n');

  try {
    // 1. Check current state
    const beforeResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at < '2025-10-01'::date) as to_delete,
        COUNT(*) FILTER (WHERE created_at >= '2025-10-01'::date) as to_keep
      FROM posts
    `);

    const { total, to_delete, to_keep } = beforeResult.rows[0];

    console.log('📊 Current state:');
    console.log(`  Total posts: ${total}`);
    console.log(`  Posts to DELETE: ${to_delete} (${((to_delete/total)*100).toFixed(1)}%)`);
    console.log(`  Posts to KEEP: ${to_keep} (${((to_keep/total)*100).toFixed(1)}%)`);

    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes will be made\n');

      // Show sample of posts to be deleted
      const sampleResult = await pool.query(`
        SELECT
          id,
          platform,
          created_at,
          username,
          LEFT(caption, 50) as caption_preview
        FROM posts
        WHERE created_at < '2025-10-01'::date
        ORDER BY created_at DESC
        LIMIT 10
      `);

      console.log('Sample of posts that WOULD be deleted (10 most recent):');
      sampleResult.rows.forEach((post, i) => {
        console.log(`  ${i+1}. [${post.platform}] ${post.created_at.toISOString().split('T')[0]} - @${post.username}`);
        if (post.caption_preview) {
          console.log(`     "${post.caption_preview}..."`);
        }
      });

      console.log(`\n✅ Dry run completed. Run without --dry-run to actually delete.`);
      return;
    }

    // 2. Confirm deletion (non-interactive - must be intentional)
    if (to_delete === 0) {
      console.log('\n✅ No posts to delete. Database is already clean!');
      return;
    }

    console.log('\n⚠️  WARNING: About to DELETE ' + to_delete + ' posts!');
    console.log('   Proceeding in 3 seconds... (Ctrl+C to cancel)\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Execute DELETE
    console.log('🗑️  Deleting posts before 2025-10-01...\n');

    const deleteResult = await pool.query(`
      DELETE FROM posts
      WHERE created_at < '2025-10-01'::date
      RETURNING id
    `);

    console.log(`✅ Deleted ${deleteResult.rowCount} posts\n`);

    // 4. Verify results
    console.log('🔍 Verifying cleanup results...\n');

    const afterResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        MIN(created_at) as earliest,
        MAX(created_at) as latest
      FROM posts
      WHERE created_at IS NOT NULL
    `);

    const after = afterResult.rows[0];

    console.log('📊 After cleanup:');
    console.log(`  Total posts: ${after.total}`);
    console.log(`  Earliest post: ${after.earliest}`);
    console.log(`  Latest post: ${after.latest}`);

    // Verify earliest is >= 2025-10-01
    const earliestDate = new Date(after.earliest);
    const cutoffDate = new Date('2025-10-01');

    if (earliestDate >= cutoffDate) {
      console.log('\n✅ SUCCESS! All posts are now from 2025-10-01 onwards');
    } else {
      console.log('\n⚠️  WARNING: Some posts before 2025-10-01 still remain!');
      console.log(`   Earliest: ${after.earliest}`);
    }

    // 5. Update views
    console.log('\n🔄 Refreshing materialized views...');

    // Views are automatically updated on next query since they're not materialized
    console.log('   Views will refresh on next query (non-materialized views)');

    console.log('\n🎉 Cleanup completed successfully!\n');

    // Summary
    console.log('📝 SUMMARY:');
    console.log(`  Before: ${total} posts`);
    console.log(`  Deleted: ${deleteResult.rowCount} posts`);
    console.log(`  After: ${after.total} posts`);
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
    console.log('🧹 POST CLEANUP SCRIPT');
    console.log('━'.repeat(50));
    console.log('Target: Delete posts before 2025-10-01');
    console.log('━'.repeat(50) + '\n');

    // Step 1: Backup (unless skipped)
    if (!skipBackup && !dryRun) {
      await makeBackup();
    } else if (skipBackup) {
      console.log('⚠️  Backup skipped (--skip-backup flag)\n');
    } else if (dryRun) {
      console.log('ℹ️  Backup skipped in dry-run mode\n');
    }

    // Step 2: Perform cleanup
    await performCleanup();

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
