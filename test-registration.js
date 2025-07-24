import axios from 'axios';

async function testRegistration() {
  try {
    console.log('🧪 Testing registration endpoint...');
    
    const API_BASE_URL = 'http://localhost:3001/api';
    
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      username: 'testuser' + Math.random().toString(36).substr(2, 9),
      email: 'test' + Math.random().toString(36).substr(2, 9) + '@example.com',
      password: 'testpassword123'
    });
    
    console.log('✅ Registration successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Registration failed!');
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data?.error || error.message);
    console.log('Full error:', error.response?.data);
  }
}

testRegistration();
