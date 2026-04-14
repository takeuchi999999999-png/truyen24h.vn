const admin = require('firebase-admin');

// Fake webhook request script
async function triggerWebhook() {
  const payload = {
    data: {
      orderCode: 123456, // Wait, I need an actual orderCode that is PENDING in the DB!
      amount: 10000,
      description: "WXU Test"
    }
  };

  try {
    const res = await fetch('http://localhost:3005/api/webhooks/payos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}

triggerWebhook();
