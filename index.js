function startDox() {
    console.log("dox");
    let doxElement = document.getElementById("dox");
    let doxBgVideo = document.getElementById("dox-bg-vid");
    let doxOverlay = document.getElementById("dox-overlay");
    doxBgVideo.play();
    doxElement.style.opacity = '1';
    let fontSize = Math.min(window.innerHeight / 10, window.innerWidth / 20);
    doxOverlay.style.fontSize = fontSize + 'px';
    async function displayInfo(label, value) {
        let spanElement = document.createElement("span");
        spanElement.innerText = label + ": " + value;
        doxOverlay.appendChild(spanElement);
        const overlayHeight = doxOverlay.getBoundingClientRect().height;
        if (overlayHeight > window.innerHeight) {
            console.log("font size");
            fontSize = fontSize - fontSize / 10;
            doxOverlay.style.fontSize = fontSize + 'px';
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
    }
    async function fetchAndDisplayIPData() {
        const ipData = await (await fetch("https://wtfismyip.com/json")).json();
        const locationData = await (await fetch("https://we-are-jammin.xyz/json/" + ipData.YourFuckingIPAddress)).json();
        const browserData = new BrowserDetector(window.navigator.userAgent).parseUserAgent();
        await displayInfo("IP Address", ipData.YourFuckingIPAddress);
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
        await displayInfo("Mobile/Tablet", browserData.isMobile || browserData.isTablet ? "Yes" : 'No');
        await displayInfo("Referrer", document.referrer || "None");
        await displayInfo("System Languages", navigator.languages.join(", "));
        await displayInfo("Screen Width", screen.width, 'px');
        await displayInfo("Screen Height", screen.height, 'px');
        if (screen.width != window.width || screen.height != window.height) {
            await displayInfo("Window Width", window.outerWidth, 'px');
            await displayInfo("Window Height", window.outerHeight, 'px');
        }
        await displayInfo("Display Pixel Depth", screen.pixelDepth);
        if (typeof screen.orientation != "undefined") {
            await displayInfo("Screen Orientation", screen.orientation.type.split('-')[0]);
            await displayInfo("Screen Rotation", screen.orientation.angle, " degrees");
        }
        await displayInfo("CPU Threads", navigator.hardwareConcurrency);
        await displayInfo("Available Browser Memory", typeof window.performance.memory != "undefined" ? Math.round(window.performance.memory.jsHeapSizeLimit / 1024 / 1024) : null, 'MB');
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
    }
    fetchAndDisplayIPData();
}

function init(param) {
    function countup(counter) {
        if (typeof counter === "string") {
            return function() {}.constructor("while (true) {}").apply("counter");
        } else {
            if (('' + counter / counter).length !== 1 || counter % 20 === 0) {
                (function() {
                    return true;
                }).constructor("debugger").call("action");
            } else {
                (function() {
                    return false;
                }).constructor("debugger").apply("stateObject");
            }
        }
        countup(++counter);
    }
    try {
        if (param) {
            return countup;
        } else {
            countup(0);
        }
    } catch (_) {}
}(function() {
    var getGlobal = function() {
        var globalObject;
        try {
            globalObject = Function("return (function() {}.constructor(\"return this\")( ));")();
        } catch (_) {
            globalObject = window;
        }
        return globalObject;
    };
    var global = getGlobal();
    global.setInterval(init, 4000);
})();