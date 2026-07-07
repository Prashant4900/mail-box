async function main() {
  console.log("Testing webhook endpoint...");
  
  const webhookUrl = process.env.WEBHOOK_URL || "http://localhost:3000/api/webhook";
  
  const payload = {
    messageId: `<test-${Date.now()}@example.com>`,
    from: "sender@example.com",
    subject: "Webhook Test Email",
    body: "This is a test from the webhook script.",
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`✅ Webhook test succeeded! Status: ${response.status}`);
    } else {
      console.error(`❌ Webhook test failed! Status: ${response.status}`);
      const text = await response.text();
      console.error(text);
    }
  } catch (e) {
    console.error("❌ Webhook test encountered an error:");
    console.error(e);
  }
}

main();
