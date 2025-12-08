import axios from 'axios';

const ENDPOINT = 'http://localhost:5001/api/execute';

const tests = [
    {
        lang: 'go',
        code: 'package main\nimport "fmt"\nfunc main() { fmt.Println("Hello from Go!") }',
        expected: 'Hello from Go'
    },
    {
        lang: 'ruby',
        code: 'puts "Hello from Ruby!"',
        expected: 'Hello from Ruby'
    }
];

async function runTests() {
    console.log(`Testing New Languages at ${ENDPOINT}...\n`);

    for (const test of tests) {
        try {
            console.log(`Sending ${test.lang}...`);
            const start = Date.now();
            const response = await axios.post(ENDPOINT, {
                language: test.lang,
                code: test.code
            });

            const data = response.data;
            const duration = Date.now() - start;

            if (data.output && data.output.includes(test.expected)) {
                console.log(`✅ [${test.lang.toUpperCase()}] Passed (${duration}ms): "${data.output.trim()}"`);
            } else {
                console.log(`❌ [${test.lang.toUpperCase()}] Failed:`, data);
            }
        } catch (e) {
            console.log(`❌ [${test.lang.toUpperCase()}] Request Error:`, e.message);
            if (e.response) console.log('Response:', e.response.data);
        }
    }
}

runTests();
