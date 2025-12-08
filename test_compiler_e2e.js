import axios from 'axios';

const ENDPOINT = 'http://localhost:5001/api/execute';

const tests = [
    {
        lang: 'python',
        code: 'print("Hello from Python! Cloud Fallback Check.")',
        expected: 'Hello from Python'
    },
    {
        lang: 'java',
        code: 'public class Main { public static void main(String[] args) { System.out.println("Hello from Java! Local Check."); } }',
        expected: 'Hello from Java'
    },
    {
        lang: 'c',
        code: '#include <stdio.h>\nint main() { printf("Hello from C! Cloud Fallback Check."); return 0; }',
        expected: 'Hello from C'
    },
    {
        lang: 'cpp',
        code: '#include <iostream>\nint main() { std::cout << "Hello from C++! Cloud Fallback Check."; return 0; }',
        expected: 'Hello from C++'
    }
];

async function runTests() {
    console.log(`Testing Compiler API at ${ENDPOINT}...\n`);

    for (const test of tests) {
        try {
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
