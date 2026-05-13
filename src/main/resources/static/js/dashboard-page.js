(function () {
  const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

  const COURSE_LABEL = {
    independence: "독립의 함성 길",
    dosan: "도산공원 코스",
  };

  const DEMO_RECENT_RUNS = [
    { date: "2026. 5. 7.", course: "도산공원 코스", distKm: 3.8, sec: 2060 },
    { date: "2026. 5. 3.", course: "독립의 함성 길", distKm: 4.1, sec: 2465 },
    { date: "2026. 4. 28.", course: "독립의 함성 길", distKm: 3.9, sec: 2380 },
    { date: "2026. 4. 21.", course: "도산공원 코스", distKm: 3.7, sec: 2010 },
    { date: "2026. 4. 15.", course: "독립의 함성 길", distKm: 4.0, sec: 2520 },
  ];

  function chartDefaults() {
    Chart.defaults.color = "#94a3b8";
    Chart.defaults.borderColor = "rgba(255,255,255,0.08)";
    Chart.defaults.font.family =
      '"Pretendard Variable", Pretendard, system-ui, sans-serif';
  }

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + "분 " + s + "초";
  }

  function formatPaceMinKm(sec, km) {
    if (!km || km <= 0 || !sec || sec <= 0) return "—";
    const mpk = sec / 60 / km;
    const m = Math.floor(mpk);
    const s = Math.round((mpk - m) * 60);
    const ss = s >= 60 ? 59 : s;
    return m + ":" + String(ss).padStart(2, "0");
  }

  function resolveCourseLabel(params) {
    const id = params.get("course");
    if (id && COURSE_LABEL[id]) return COURSE_LABEL[id];
    try {
      const ls = localStorage.getItem("rerunCourseLabel");
      if (ls) return ls;
    } catch (e) {}
    return COURSE_LABEL.independence;
  }

  function todayYmd() {
    const d = new Date();
    return (
      d.getFullYear() +
      ". " +
      String(d.getMonth() + 1).padStart(2, "0") +
      ". " +
      String(d.getDate()).padStart(2, "0") +
      "."
    );
  }

  function renderRecentRows(tbody, params, courseLabel) {
    const distStr = params.get("d");
    const elapsedStr = params.get("t");
    const dist = distStr ? parseFloat(distStr) : NaN;
    const elapsed = elapsedStr ? parseInt(elapsedStr, 10) : NaN;
    const hasToday =
      distStr &&
      elapsedStr &&
      !Number.isNaN(dist) &&
      !Number.isNaN(elapsed) &&
      dist > 0;

    const rows = [];
    if (hasToday) {
      rows.push({
        date: todayYmd(),
        course: courseLabel,
        distKm: dist,
        sec: elapsed,
        isToday: true,
      });
    }
    DEMO_RECENT_RUNS.forEach(function (r) {
      rows.push({
        date: r.date,
        course: r.course,
        distKm: r.distKm,
        sec: r.sec,
        isToday: false,
      });
    });

    tbody.innerHTML = rows
      .map(function (r) {
        const pace = formatPaceMinKm(r.sec, r.distKm);
        const trClass = r.isToday ? ' class="dash-row-today"' : "";
        return (
          "<tr" +
          trClass +
          "><td>" +
          (r.isToday ? r.date + ' <span class="badge bg-danger bg-opacity-50 ms-1">방금</span>' : r.date) +
          "</td><td>" +
          r.course +
          '</td><td class="text-end">' +
          r.distKm.toFixed(1) +
          ' km</td><td class="text-end">' +
          formatDuration(r.sec) +
          '</td><td class="text-end">' +
          pace +
          "</td></tr>"
        );
      })
      .join("");
  }

  function monthBannerText(hasToday, todayDist) {
    const monthRuns = DEMO_RECENT_RUNS.length + (hasToday ? 1 : 0);
    let sum = DEMO_RECENT_RUNS.reduce(function (a, r) {
      return a + r.distKm;
    }, 0);
    if (hasToday && !Number.isNaN(todayDist)) sum += todayDist;
    return (
      "이번 달 누적 <strong>" +
      sum.toFixed(1) +
      " km</strong> · 완주 <strong>" +
      monthRuns +
      "회</strong>"
    );
  }

  function fillStatTiles(params) {
    const distStr = params.get("d");
    const elapsedStr = params.get("t");
    const dist = distStr ? parseFloat(distStr) : NaN;
    const elapsed = elapsedStr ? parseInt(elapsedStr, 10) : NaN;
    const has = distStr && elapsedStr && !Number.isNaN(dist) && !Number.isNaN(elapsed) && dist > 0;

    const elDist = document.getElementById("dash-stat-dist");
    const elTime = document.getElementById("dash-stat-time");
    const elPace = document.getElementById("dash-stat-pace");
    const elCp = document.getElementById("dash-stat-cp");
    const hintD = document.getElementById("dash-stat-dist-hint");
    const hintT = document.getElementById("dash-stat-time-hint");

    if (has) {
      elDist.textContent = dist.toFixed(1) + " km";
      elTime.textContent = formatDuration(elapsed);
      elPace.textContent = formatPaceMinKm(elapsed, dist);
      elCp.textContent = "4 / 4";
      hintD.textContent = "방금 완주한 기록";
      hintT.textContent = "";
    } else {
      elDist.textContent = "—";
      elTime.textContent = "—";
      elPace.textContent = "—";
      elCp.textContent = "—";
      hintD.textContent = "러닝을 마치면 거리·시간이 채워집니다";
      hintT.textContent = "";
    }
  }

  let replayTimer;
  function replayRoute(map, latlngs) {
    const marker = L.circleMarker(latlngs[0], {
      radius: 8,
      color: "#22c55e",
      fillColor: "#4ade80",
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);

    let i = 0;
    clearInterval(replayTimer);
    replayTimer = setInterval(() => {
      i++;
      if (i >= latlngs.length) {
        clearInterval(replayTimer);
        return;
      }
      marker.setLatLng(latlngs[i]);
      map.panTo(latlngs[i]);
    }, 120);
  }

  Promise.all([
    fetch("/api/course/independence-shout").then((r) => r.json()),
    fetch("/api/course/dashboard-stats").then((r) => r.json()),
  ])
    .then(([course, stats]) => {
      const params = new URLSearchParams(location.search);
      const elapsed = params.get("t");
      const dist = params.get("d");
      const courseLabel = resolveCourseLabel(params);

      document.getElementById("dash-course-chip").textContent = courseLabel;

      document.getElementById("summary-line").textContent =
        dist && elapsed
          ? "방금 완주를 마쳤습니다 · " +
            courseLabel +
            ". 아래에서 거리·페이스·최근 기록을 확인할 수 있어요."
          : "코스를 완주하면 요약과 표 맨 위에 오늘 기록이 붙습니다.";

      document.getElementById("honor-stat").textContent =
        "이 코스를 완주함으로써 당신은 서울 지역 보훈 지수를 " +
        stats.seoulHonorIndexDeltaPercent +
        "% 올렸습니다.";

      document.getElementById("heat-caption").textContent =
        "최근 24시간 동안 이 코스를 함께 달린 청년 " +
        stats.runnersLast24h +
        "명의 흔적";

      fillStatTiles(params);

      const distNum = dist ? parseFloat(dist) : NaN;
      const hasToday =
        dist &&
        elapsed &&
        !Number.isNaN(distNum) &&
        distNum > 0;
      document.getElementById("dash-month-banner").innerHTML = monthBannerText(
        !!hasToday,
        distNum
      );

      renderRecentRows(document.getElementById("dash-recent-body"), params, courseLabel);

      const latlngs = course.route.map((p) => [p.lat, p.lng]);
      const map = L.map("dash-map", { zoomControl: true }).setView(latlngs[0], 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OSM &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      L.polyline(latlngs, { color: "#d62828", weight: 4, opacity: 0.85 }).addTo(map);

      const heatData = stats.heatPoints.map((h) => [h.lat, h.lng, h.intensity]);
      L.heatLayer(heatData, {
        radius: 28,
        blur: 22,
        maxZoom: 17,
        max: 1.2,
        gradient: { 0.2: "#1d4ed8", 0.5: "#d62828", 0.9: "#fbbf24" },
      }).addTo(map);

      map.fitBounds(L.polyline(latlngs).getBounds(), { padding: [40, 40] });

      document.getElementById("btn-replay").addEventListener("click", () => {
        replayRoute(map, latlngs);
      });

      chartDefaults();

      new Chart(document.getElementById("chart-weekly"), {
        type: "bar",
        data: {
          labels: weekdays,
          datasets: [
            {
              label: "참여 러너 (명)",
              data: stats.weeklyParticipation,
              backgroundColor: "rgba(214, 40, 40, 0.75)",
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.06)" } },
          },
        },
      });

      const paceLabels = stats.paceMinutesPerKm.map((_, i) => i + 1 + "km");
      new Chart(document.getElementById("chart-pace"), {
        type: "line",
        data: {
          labels: paceLabels,
          datasets: [
            {
              label: "페이스 (분/km)",
              data: stats.paceMinutesPerKm,
              tension: 0.35,
              fill: true,
              backgroundColor: "rgba(29, 78, 216, 0.2)",
              borderColor: "#60a5fa",
              pointBackgroundColor: "#93c5fd",
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              reverse: false,
              beginAtZero: false,
              grid: { color: "rgba(255,255,255,0.06)" },
            },
            x: { grid: { display: false } },
          },
        },
      });
    })
    .catch(() => {
      document.getElementById("summary-line").textContent =
        "데이터를 불러오지 못했습니다.";
      document.getElementById("dash-month-banner").textContent = "";
    });
})();
