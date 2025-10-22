// Test script to simulate frontend loading
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAllEndpoints() {
  console.log('Testing all dashboard endpoints...\n');

  try {
    // Test 1: Stats
    console.log('1. Testing /api/stats...');
    const stats = await fetch(`${API_BASE_URL}/stats`);
    const statsData = await stats.json();
    console.log(`✓ Stats: ${statsData.length} platforms`);

    // Test 2: Timeline
    console.log('\n2. Testing /api/timeline...');
    const timeline = await fetch(`${API_BASE_URL}/timeline`);
    const timelineData = await timeline.json();
    console.log(`✓ Timeline: ${timelineData.length} data points`);

    // Test 3: Hashtags
    console.log('\n3. Testing /api/hashtags...');
    const hashtags = await fetch(`${API_BASE_URL}/hashtags?limit=50`);
    const hashtagsData = await hashtags.json();
    console.log(`✓ Hashtags: ${hashtagsData.length} hashtags`);

    // Test 4: Hashtag Network
    console.log('\n4. Testing /api/hashtag-network...');
    const network = await fetch(`${API_BASE_URL}/hashtag-network?minCoOccurrence=3`);
    const networkData = await network.json();
    console.log(`✓ Network: ${networkData.nodes.length} nodes, ${networkData.links.length} links`);

    // Test 5: Top Posts
    console.log('\n5. Testing /api/top-posts...');
    const topPosts = await fetch(`${API_BASE_URL}/top-posts?metric=likes_count&limit=20`);
    const topPostsData = await topPosts.json();
    console.log(`✓ Top Posts: ${topPostsData.length} posts`);

    console.log('\n✅ All endpoints working correctly!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAllEndpoints();
