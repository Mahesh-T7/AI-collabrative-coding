import axios from 'axios';

const API_URL = 'http://localhost:5001/api';
const EMAIL = 'comet@example.com';
const PASSWORD = 'Test123456!';
const PROJECT_ID = '6933df0b40f2372dc5339333'; // mern_todo

async function testBackend() {
    try {
        console.log('1. Attempting Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        if (loginRes.status === 200 || loginRes.status === 201) {
            console.log('✅ Login Successful!');
            // The controller returns: { _id, name, email, token } based on typical MERN structure
            // Let's inspect the response to be sure
            // console.log(loginRes.data);

            const token = loginRes.data.token || loginRes.data._id; // Adjust based on actual response if token isn't explicit, but usually it's 'token'

            if (!token) {
                console.error('❌ No token found in response');
                return;
            }

            console.log('2. Attempting Project Sync...');
            const syncRes = await axios.post(
                `${API_URL}/files/sync/${PROJECT_ID}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (syncRes.status === 200) {
                console.log('✅ Project Sync Successful!');
                console.log('Response:', syncRes.data);
            } else {
                console.error('❌ Project Sync Failed:', syncRes.status, syncRes.data);
            }

        } else {
            console.error('❌ Login Failed:', loginRes.status);
        }

    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
}

testBackend();
