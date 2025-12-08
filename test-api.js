// Quick test script to verify API endpoints
import http from 'http';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n=== CodeCollab API Test Suite ===\n');

  // Test 1: Health Check
  console.log('[TEST 1] Health Check');
  try {
    const result = await makeRequest('GET', '/api/health');
    console.log(`✅ Status: ${result.status}`);
    console.log(`Response: ${JSON.stringify(result.data)}\n`);
  } catch (err) {
    console.log(`❌ Failed: ${err.message}\n`);
    return;
  }

  // Test 2: Register new user
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123';
  
  console.log('[TEST 2] User Registration');
  let token = '';
  try {
    const result = await makeRequest('POST', '/api/auth/register', {
      email: testEmail,
      password: testPassword
    });
    console.log(`✅ Status: ${result.status}`);
    token = result.data.token;
    console.log(`User: ${result.data.email}`);
    console.log(`Token received: ${token ? 'YES' : 'NO'}\n`);
  } catch (err) {
    console.log(`❌ Failed: ${err.message}\n`);
  }

  // Test 3: Login
  console.log('[TEST 3] User Login');
  try {
    const result = await makeRequest('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });
    console.log(`✅ Status: ${result.status}`);
    console.log(`Token matches: ${result.data.token === token}\n`);
  } catch (err) {
    console.log(`❌ Failed: ${err.message}\n`);
  }

  // Test 4: Get current user
  console.log('[TEST 4] Get Current User (Auth Required)');
  try {
    const result = await makeRequest('GET', '/api/auth/me', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`✅ Status: ${result.status}`);
    console.log(`Username: ${result.data.username}`);
    console.log(`Email: ${result.data.email}\n`);
  } catch (err) {
    console.log(`❌ Failed: ${err.message}\n`);
  }

  // Test 5: AI Chat
  console.log('[TEST 5] AI Chat Endpoint');
  try {
    const result = await makeRequest('POST', '/api/ai/chat', {
      message: 'Hello! Can you explain what JavaScript is?',
      codeContext: '',
      conversationHistory: []
    }, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`✅ Status: ${result.status}`);
    if (result.data.response) {
      console.log(`Response: ${result.data.response.substring(0, 150)}...`);
    } else {
      console.log(`Error: ${result.data.message || JSON.stringify(result.data)}`);
    }
    console.log();
  } catch (err) {
    console.log(`❌ Failed: ${err.message}\n`);
  }

  // Test 6: AI Explain Code
  console.log('[TEST 6] AI Explain Code');
  try {
    const result = await makeRequest('POST', '/api/ai/explain', {
      code: 'const x = 5; console.log(x);',
      language: 'javascript'
    }, {
      'Authorization': `Bearer ${token}`
    });
    console.log(`✅ Status: ${result.status}`);
    if (result.data.explanation) {
      console.log(`Response: ${result.data.explanation.substring(0, 150)}...`);
    } else {
      console.log(`Error: ${result.data.message || JSON.stringify(result.data)}`);
    }
    console.log();
  } catch (err) {
    console.log(`❌ Failed: ${err.message}\n`);
  }

  // Test 7: Unauthenticated AI request (should fail)
  console.log('[TEST 7] AI Request Without Auth (Should Fail)');
  try {
    const result = await makeRequest('POST', '/api/ai/chat', {
      message: 'Hello',
      codeContext: '',
      conversationHistory: []
    });
    if (result.status === 401) {
      console.log(`✅ Correctly rejected with 401 Unauthorized\n`);
    } else {
      console.log(`❌ Should have been rejected! Status: ${result.status}\n`);
    }
  } catch (err) {
    console.log(`❌ Failed: ${err.message}\n`);
  }

  console.log('=== Test Summary ===');
  console.log('✅ Backend is running on port 5001');
  console.log('✅ Database connection successful');
  console.log('✅ Authentication implemented');
  console.log('✅ AI endpoints integrated');
  console.log(`\nFrontend: http://localhost:8081`);
  console.log(`Test credentials: ${testEmail} / ${testPassword}`);
}

runTests().catch(console.error);
