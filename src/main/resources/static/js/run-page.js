(function () {
  (function initRunUiFromStorage() {
    const labelEl = document.getElementById("run-course-label");
    const wrap = document.getElementById("run-pair-wrap");
    const pairText = document.getElementById("run-pair-banner-text");
    const dismiss = document.getElementById("run-pair-dismiss");
    try {
      const cl = localStorage.getItem("rerunCourseLabel");
      if (labelEl && cl) labelEl.textContent = cl;
      const pn = localStorage.getItem("rerunPairNote");
      if (wrap && pairText && pn) {
        pairText.textContent = pn;
        wrap.classList.remove("d-none");
      }
      if (dismiss && wrap) {
        dismiss.addEventListener("click", function () {
          wrap.classList.add("d-none");
        });
      }
    } catch (e) {}
  })();

  const EARTH_KM_PER_DEG = 111.32;

  function distKm(a, b) {
    const dx = (a.lat - b.lat) * EARTH_KM_PER_DEG;
    const dy = (a.lng - b.lng) * EARTH_KM_PER_DEG * Math.cos((a.lat * Math.PI) / 180);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function formatElapsed(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  }

  let map;
  let routeLayer;
  let userMarker;
  let checkpoints = [];
  let routePoints = [];
  let checkinModal;
  let infoModal;
  let elapsedSec = 0;
  let timerId;
  let visitedCount = 0;
  let currentNearest = null;

  function loadDisplayName() {
    return localStorage.getItem("honorDisplayName") || "";
  }

  function checkinMessage(rank) {
    const name = loadDisplayName();
    if (name) {
      return name + "님은 오늘 " + rank + "번째 독립 영웅을 만났습니다!";
    }
    return "당신은 오늘 " + rank + "번째 독립 영웅을 만났습니다!";
  }

  function startTimer() {
    if (timerId) return;
    const start = Date.now() - elapsedSec * 1000;
    timerId = setInterval(() => {
      elapsedSec = (Date.now() - start) / 1000;
      document.getElementById("stat-time").textContent = formatElapsed(elapsedSec);
      const km = Math.min(4.5, (elapsedSec / 2400) * 4.5);
      document.getElementById("stat-dist").textContent = km.toFixed(1) + " km";
      document.getElementById("stat-kcal").textContent = Math.round(km * 62) + " kcal";
    }, 250);
  }

  function updateStoryCard() {
    const card = document.getElementById("active-story");
    if (!currentNearest) {
      card.textContent = "코스를 불러오는 중입니다…";
      return;
    }
    card.innerHTML =
      "<strong class=\"text-light\">" +
      currentNearest.name +
      "</strong><p class=\"mb-0 mt-2 text-muted small\">" +
      currentNearest.story +
      "</p>";
  }

  function refreshNearest(pos) {
    let best = null;
    let bestD = Infinity;
    for (const c of checkpoints) {
      const d = distKm(pos, { lat: c.lat, lng: c.lng });
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    currentNearest = best;
    updateStoryCard();

    const btn = document.getElementById("btn-checkin");
    const hint = document.getElementById("checkin-hint");
    if (best && bestD < 0.5) {
      btn.disabled = false;
      hint.textContent = "역사 현장 근처입니다. 체크인할 수 있습니다.";
      btn.dataset.checkpointId = best.id;
    } else {
      btn.disabled = true;
      hint.textContent = "사적지에 가까이 가면 체크인이 활성화됩니다.";
    }
  }

  function openCheckin(cp) {
    if (!cp) return;
    visitedCount = parseInt(sessionStorage.getItem("honorVisits") || "0", 10) + 1;
    sessionStorage.setItem("honorVisits", String(visitedCount));
    document.getElementById("checkin-headline").textContent = checkinMessage(visitedCount);
    document.getElementById("checkin-place").textContent = cp.name;
    document.getElementById("checkin-past").src = cp.imagePastUrl;
    document.getElementById("checkin-present").src = cp.imagePresentUrl;
    document.getElementById("checkin-caption").textContent = cp.historyNote;
    checkinModal.show();
  }

  function initMap(course) {
    routePoints = course.route.map((p) => [p.lat, p.lng]);
    checkpoints = course.checkpoints;

    map = L.map("run-map", { zoomControl: true }).setView([37.5712, 126.9883], 14);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    routeLayer = L.polyline(routePoints, {
      color: "#d62828",
      weight: 5,
      opacity: 0.9,
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds(), { padding: [36, 36] });

    checkpoints.forEach((cp) => {
      const icon = L.divIcon({
        className: "checkpoint-star",
        html: '<i class="bi bi-star-fill"></i>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const m = L.marker([cp.lat, cp.lng], { icon }).addTo(map);
      m.on("click", () => {
        document.getElementById("modal-cp-title").textContent = cp.name;
        document.getElementById("modal-cp-body").textContent = cp.historyNote;
        infoModal.show();
      });
    });

    const start = routePoints[0];
    userMarker = L.circleMarker(start, {
      radius: 10,
      color: "#2563eb",
      fillColor: "#3b82f6",
      fillOpacity: 0.95,
      weight: 2,
    }).addTo(map);

    refreshNearest({ lat: start[0], lng: start[1] });

    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          userMarker.setLatLng([lat, lng]);
          refreshNearest({ lat, lng });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    }
  }

  document.getElementById("btn-checkin").addEventListener("click", () => {
    const id = document.getElementById("btn-checkin").dataset.checkpointId;
    const cp = checkpoints.find((c) => c.id === id);
    openCheckin(cp || currentNearest);
  });

  document.getElementById("btn-finish").addEventListener("click", () => {
    const q = new URLSearchParams({
      t: String(Math.floor(elapsedSec)),
      d: document.getElementById("stat-dist").textContent.replace(/[^\d.]/g, ""),
    });
    try {
      const cid = localStorage.getItem("rerunCourseId");
      if (cid) q.set("course", cid);
    } catch (e) {}
    window.location.href = "/dashboard.html?" + q.toString();
  });

  checkinModal = new bootstrap.Modal(document.getElementById("modal-checkin"));
  infoModal = new bootstrap.Modal(document.getElementById("modal-checkpoint"));

  fetch("/api/course/independence-shout")
    .then((r) => r.json())
    .then((course) => {
      initMap(course);
      startTimer();
    })
    .catch(() => {
      document.getElementById("active-story").textContent = "코스 데이터를 불러오지 못했습니다. 서버를 확인해 주세요.";
    });
})();
