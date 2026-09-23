const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const BASE_URL = 'http://localhost:5000/api';

async function runAuthTests() {
  console.log('=======================================================');
  console.log(' RUNNING SPORTTRACK AUTHENTICATION & SECURITY TESTS');
  console.log('=======================================================\n');

  let passed = 0;
  let failed = 0;

  const testEmail = `athlete.test.${Date.now()}@sporttrack.ai`;
  const testPassword = 'StrongPassword123!';
  let authToken = '';

  // 1. Test Registration
  try {
    const res = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Jordan Test Athlete',
      email: testEmail,
      password: testPassword,
      role: 'player',
      sport: 'basketball',
      dominantSide: 'right'
    });

    if (res.status === 201 && res.data.token && res.data.user) {
      authToken = res.data.token;
      if (res.data.user.password) {
        throw new Error('Security Violation: Password field exposed in response!');
      }
      console.log('✓ TEST 1 PASSED: Athlete Registration & JWT Generation');
      passed++;
    } else {
      throw new Error(`Unexpected status code: ${res.status}`);
    }
  } catch (err) {
    console.error('✗ TEST 1 FAILED: Registration error:', err.response?.data || err.message);
    failed++;
  }

  // 2. Test Duplicate Email Prevention
  try {
    await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Duplicate Athlete',
      email: testEmail,
      password: 'anotherpassword'
    });
    console.error('✗ TEST 2 FAILED: Duplicate registration was allowed!');
    failed++;
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('✓ TEST 2 PASSED: Duplicate Email Rejected (400 Bad Request)');
      passed++;
    } else {
      console.error('✗ TEST 2 FAILED: Expected 400, got:', err.response?.status);
      failed++;
    }
  }

  // 3. Test Invalid Credentials Login
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'WrongPassword!'
    });
    console.error('✗ TEST 3 FAILED: Invalid password login was allowed!');
    failed++;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('✓ TEST 3 PASSED: Invalid Password Rejected (401 Unauthorized)');
      passed++;
    } else {
      console.error('✗ TEST 3 FAILED: Expected 401, got:', err.response?.status);
      failed++;
    }
  }

  // 4. Test Valid Credentials Login
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });

    if (res.status === 200 && res.data.token && res.data.user.email === testEmail) {
      authToken = res.data.token;
      console.log('✓ TEST 4 PASSED: Valid Login & Token Issuance');
      passed++;
    } else {
      throw new Error('Login failed to return expected token or user payload');
    }
  } catch (err) {
    console.error('✗ TEST 4 FAILED: Login failed:', err.response?.data || err.message);
    failed++;
  }

  // 5. Test Protected Route with Token (/api/auth/profile)
  try {
    const res = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (res.status === 200 && res.data.user && res.data.user.email === testEmail) {
      console.log('✓ TEST 5 PASSED: Protected /api/auth/profile with Bearer Token');
      passed++;
    } else {
      throw new Error('Profile fetch failed with token');
    }
  } catch (err) {
    console.error('✗ TEST 5 FAILED: Protected route error:', err.response?.data || err.message);
    failed++;
  }

  // 6. Test Protected Route without Token (Expect 401)
  try {
    await axios.post(`${BASE_URL}/sessions`, {
      title: 'Unauthorized Test Session',
      sport: 'basketball'
    });
    console.error('✗ TEST 6 FAILED: Protected session creation allowed without token!');
    failed++;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log('✓ TEST 6 PASSED: Protected Route Rejects Unauthenticated Request (401)');
      passed++;
    } else {
      console.error('✗ TEST 6 FAILED: Expected 401, got:', err.response?.status);
      failed++;
    }
  }

  // 7. Test Protected Session Creation with Token
  try {
    const res = await axios.post(`${BASE_URL}/sessions`, {
      title: 'Authenticated Pro Shooting Drill',
      sport: 'basketball',
      dominantSide: 'right',
      totalShots: 25,
      madeShots: 21,
      missedShots: 4,
      accuracyPercentage: 84.0,
      performanceIndex: 89.5
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (res.status === 201 && res.data) {
      console.log('✓ TEST 7 PASSED: Protected Session Creation with Valid Token');
      passed++;
    } else {
      throw new Error('Failed to create session');
    }
  } catch (err) {
    console.error('✗ TEST 7 FAILED: Session creation error:', err.response?.data || err.message);
    failed++;
  }

  console.log('\n=======================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Allow standalone execution
if (require.main === module) {
  runAuthTests();
}

module.exports = { runAuthTests };

