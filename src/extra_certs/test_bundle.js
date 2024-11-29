const request = require('axios');

async function test(){
    if(!process.env.NODE_EXTRA_CA_CERTS) console.log('Env variable NODE_EXTRA_CA_CERTS not found! Please rerun with \ncross-env NODE_EXTRA_CA_CERTS=ca_bundle/ca_intermediate_root_bundle.pem node test_bundle.js')
    
    const r = await request.get("https://incomplete-chain.badssl.com/");

    if(!process.env.NODE_EXTRA_CA_CERTS)
        console.log('--- All request worked without any NODE_EXTRA_CA_CERTS configuration');
    else
        console.log(`--- Certificate bundle ${process.env.NODE_EXTRA_CA_CERTS} is working`);

    // This message is there to ensure that the above URL still fails without the NODE_EXTRA_CA_CERTS
    // Since if it does not, than we cant ensure that certificate bundle files are working with this test script
    console.log('run this file with "node test_bundle.js" to ensure that it fails when run without NODE_EXTRA_CA_CERTS');
}
test();
