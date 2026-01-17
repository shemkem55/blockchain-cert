const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'https://blockchain-cert-backend.onrender.com';

function checkEndpoint(path, name) {
    return new Promise((resolve, reject) => {
        const url = `${BACKEND_URL}${path}`;
        console.log(`Checking ${name} at ${url}...`);

        const requestModule = url.startsWith('https') ? https : http;

        const req = requestModule.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';

            res.on('data', chunk => data += chunk);

            res.on('end', () => {
                const contentType = res.headers['content-type'];
                const isJson = contentType && contentType.includes('application/json');

                console.log(`[${name}] Status: ${res.statusCode}`);
                console.log(`[${name}] Content-Type: ${contentType}`);

                if (!isJson) {
                    console.error(`❌ FAILURE: ${name} returned non-JSON response!`);
                    console.error('Response preview:', data.substring(0, 200));
                    reject(new Error(`Non-JSON response from ${name}`));
                } else {
                    console.log(`✅ SUCCESS: ${name} returned JSON.`);
                    try {
                        const json = JSON.parse(data);
                        console.log('Response:', JSON.stringify(json));
                        resolve(true);
                    } catch (e) {
                        console.error(`❌ FAILURE: ${name} returned invalid JSON!`);
                        reject(e);
                    }
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ FAILURE: Network error for ${name}`, e);
            reject(e);
        });

        // Send checking body
        req.write(JSON.stringify({
            email: 'test-integrity-check@example.com',
            password: 'invalid-password-check',
            username: 'root', // for admin
            role: 'student'
        }));

        req.end();
    });
}

async function run() {
    try {
        console.log('🔍 Starting Login Contract Validation...');
        await checkEndpoint('/auth/login', 'Student Login');
        await checkEndpoint('/auth/admin-login', 'Admin Login');
        console.log('🎉 All Login Contracts Validated. System is returning JSON correctly.');
    } catch (e) {
        console.error('💥 Validation Failed');
        process.exit(1);
    }
}

run();
