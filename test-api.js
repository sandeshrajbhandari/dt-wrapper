// Simple test script to check if DrawThings API is running
import fetch from 'node-fetch';

async function testDrawThingsAPI() {
  const baseUrl = 'http://localhost:7860';
  
  try {
    console.log('Testing DrawThings API connection...');
    
    // Test basic connectivity
    const response = await fetch(`${baseUrl}/sdapi/v1/options`);
    
    if (response.ok) {
      console.log('✅ DrawThings API is running and accessible');
      const data = await response.json();
      console.log('Available options:', Object.keys(data));
    } else {
      console.log(`❌ API responded with status: ${response.status}`);
    }
    
  } catch (error) {
    console.log('❌ Failed to connect to DrawThings API');
    console.log('Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. DrawThings is installed and running');
    console.log('2. DrawThings is listening on port 7859');
    console.log('3. API is enabled in DrawThings settings');
  }
}

testDrawThingsAPI(); 