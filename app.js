"use strict";

// Coast Dairies station
const STATION_ID = "XCDC1";
const REFRESH_MS = 2 * 60 * 1000; // every 2 minutes

let timerId = null;

function el(id) { return document.getElementById(id); }

function setStatus(msg) {
  el("status").textContent = msg;
}

function toLocalString(isoString) {
  const d = new Date(isoString);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

// NWS windSpeed.value is typically meters/second
function mpsToMph(mps) {
  return mps * 2.2369362920544;
}

function degToCardinal(deg) {
  // 16-wind compass
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  const i = Math.round(((deg % 360) / 22.5)) % 16;
  return dirs[i];
}

async function fetchLatest() {
  const url = `https://api.weather.gov/stations/${STATION_ID}/observations/latest`;

  // Browsers generally won't let you set the true User-Agent header; this is often ignored.
  // NWS still usually works fine for this endpoint in-browser.
  const res = await fetch(url, {
    headers: {
      "Accept": "application/geo+json",
      "User-Agent": "wind-app (you@example.com)"
    }
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

function updateUI(p) {
  const speedVal = p?.windSpeed?.value;
  const dirVal = p?.windDirection?.value;

  // Speed
  if (speedVal === null || speedVal === undefined) {
    el("speedText").textContent = "—";
  } else {
    el("speedText").textContent = `${mpsToMph(speedVal).toFixed(1)} mph`;
  }

  // Direction + needle rotation
  if (dirVal === null || dirVal === undefined) {
    el("dirText").textContent = "—";
  } else {
    const d = ((dirVal % 360) + 360) % 360;
    el("dirText").textContent = `${Math.round(d)}° ${degToCardinal(d)}`;

    // Rotate the needle to match "degrees from north"
    // (0° = North, 90° = East, etc.) which matches CSS rotate convention here.
    el("needle").style.transform = `translate(-50%, -90%) rotate(${d}deg)`;
  }

  // Time
  el("timeText").textContent = toLocalString(p?.timestamp);
}

async function tick() {
  try {
    setStatus("Fetching…");
    const data = await fetchLatest();
    updateUI(data.properties);
    setStatus(`OK • ${STATION_ID}`);
  } catch (err) {
    console.error(err);
    setStatus(`Error: ${err.message}`);
  }
}

function start() {
  if (timerId) clearInterval(timerId);
  tick();
  timerId = setInterval(tick, REFRESH_MS);
}

document.addEventListener("DOMContentLoaded", start);
