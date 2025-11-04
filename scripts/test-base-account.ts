/**
 * Base Account API 테스트 스크립트
 */

async function testBaseAccountAPI() {
    const testAddress = '0x1234567890123456789012345678901234567890';

    try {
        console.log('🧪 Testing Base Account API...');

        const response = await fetch('http://localhost:3001/api/base/account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                address: testAddress,
                isSignIn: true
            }),
        });

        console.log('📊 Response status:', response.status);

        const data = await response.text();
        console.log('📋 Response data:', data);

        if (response.ok) {
            console.log('✅ Base Account API is working!');
        } else {
            console.log('❌ Base Account API failed');
        }

    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

testBaseAccountAPI();