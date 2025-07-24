import axios from 'axios';

// Test frontend connection to backend
async function testFrontendConnection() {
  console.log('🧪 Testing frontend->backend connection...');
  
  // Simulate frontend configuration
  const API_BASE_URL = 'http://localhost:3001/api';
  axios.defaults.baseURL = API_BASE_URL;
  
  console.log('🔧 API Base URL:', API_BASE_URL);
  
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await axios.get('/health');
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test registration endpoint
    console.log('Testing registration endpoint...');
    const regResponse = await axios.post('/auth/register', {
      username: 'frontendtest' + Math.random().toString(36).substr(2, 9),
      email: 'frontendtest' + Math.random().toString(36).substr(2, 9) + '@example.com',
      password: 'testpassword123'
    });
    
    console.log('✅ Frontend registration test passed!');
    console.log('Status:', regResponse.status);
    console.log('Response:', regResponse.data);
    
  } catch (error) {
    console.log('❌ Frontend connection failed!');
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data?.error || error.message);
    console.log('Request URL:', error.config?.url);
    console.log('Base URL:', error.config?.baseURL);
  }
}

testFrontendConnection();
