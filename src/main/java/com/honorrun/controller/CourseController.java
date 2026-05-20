package com.honorrun.controller;

import com.honorrun.dto.Checkpoint;
import com.honorrun.dto.CoursePayload;
import com.honorrun.dto.MapPoint;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/course")
public class CourseController {

    /**
     * 독립의 함성 길 — 탑골공원 → 승동교회 → 태화관 터 → 서대문형무소 (대략 경로)
     */
    @GetMapping("/independence-shout")
    public CoursePayload independenceShout() {
        List<MapPoint> route = List.of(
                new MapPoint(37.5712, 126.9883),
                new MapPoint(37.5710, 126.9865),
                new MapPoint(37.5708, 126.9845),
                new MapPoint(37.5705, 126.9820),
                new MapPoint(37.5702, 126.9785),
                new MapPoint(37.5700, 126.9740),
                new MapPoint(37.5710, 126.9680),
                new MapPoint(37.5725, 126.9620),
                new MapPoint(37.5740, 126.9580),
                new MapPoint(37.5743, 126.9563)
        );

        List<Checkpoint> checkpoints = List.of(
                new Checkpoint(
                        "tapgol",
                        "탑골공원",
                        37.5712,
                        126.9883,
                        "지금 탑골공원 근처를 지나고 있습니다. 3·1운동의 함성이 울려 퍼진 상징적인 광장입니다.",
                        "1919년 3월 1일, 수많은 시민이 모여 독립선언의 뜻을 함께 외쳤습니다.",
                        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tapgol_Park_2019.jpg/640px-Tapgol_Park_2019.jpg",
                        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tapgol_Park_2019.jpg/640px-Tapgol_Park_2019.jpg"
                ),
                new Checkpoint(
                        "seungdong",
                        "승동교회",
                        37.5709,
                        126.9848,
                        "지금 승동교회 인근을 지나고 있습니다. 민족 교회로서 독립운동의 한 축을 담당했습니다.",
                        "기독교 계열 독립운동가들이 연대하며 민족의 자주성을 지켜 나갔습니다.",
                        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Seungdong_Church_2018.jpg/640px-Seungdong_Church_2018.jpg",
                        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Seungdong_Church_2018.jpg/640px-Seungdong_Church_2018.jpg"
                ),
                new Checkpoint(
                        "taehwagwan",
                        "태화관 터",
                        37.5703,
                        126.9780,
                        "지금 태화관 터 근처를 지나고 있습니다. 1919년 독립선언서가 낭독된 역사적 장소입니다.",
                        "독립선언의 글이 이곳에서 세상에 알려지며 3·1운동의 불씨가 타올랐습니다.",
                        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Jongno-gu_Office.jpg/640px-Jongno-gu_Office.jpg",
                        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Jongno-gu_Office.jpg/640px-Jongno-gu_Office.jpg"
                ),
                new Checkpoint(
                        "seodaemun",
                        "서대문형무소",
                        37.5743,
                        126.9563,
                        "지금 서대문형무소 역사관 인근입니다. 독립운동가들의 희생이 기록된 곳입니다.",
                        "수많은 애국지사가 옥고를 겪었고, 오늘날 우리는 그 정신을 이어 갑니다.",
                        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Seodaemun_Prison_History_Hall_20200913_001.jpg/640px-Seodaemun_Prison_History_Hall_20200913_001.jpg",
                        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Seodaemun_Prison_History_Hall_20200913_001.jpg/640px-Seodaemun_Prison_History_Hall_20200913_001.jpg"
                )
        );

        return new CoursePayload(
                "independence-shout",
                "독립의 함성 길",
                route,
                checkpoints
        );
    }

    @GetMapping("/dashboard-stats")
    public DashboardStats dashboardStats() {
        return new DashboardStats(
                List.of(42, 55, 48, 61, 73, 89, 67),
                List.of(5.8, 5.5, 5.4, 5.6, 5.3, 5.2, 5.1, 5.0),
                124,
                0.5,
                sampleHeatPoints()
        );
    }

    /** 최근 24시간 러너 흔적 시뮬레이션 (코스 주변 가우시안 분포) */
    private List<HeatPoint> sampleHeatPoints() {
        double[][] seeds = {
                {37.5712, 126.9883}, {37.5708, 126.9845}, {37.5703, 126.9780},
                {37.5725, 126.9620}, {37.5743, 126.9563}
        };
        List<HeatPoint> out = new ArrayList<>();
        ThreadLocalRandom r = ThreadLocalRandom.current();
        for (int i = 0; i < 124; i++) {
            double[] c = seeds[i % seeds.length];
            double lat = c[0] + (r.nextDouble() - 0.5) * 0.004;
            double lng = c[1] + (r.nextDouble() - 0.5) * 0.006;
            double intensity = 0.3 + r.nextDouble() * 0.7;
            out.add(new HeatPoint(lat, lng, intensity));
        }
        return out;
    }

    public record HeatPoint(double lat, double lng, double intensity) {}

    public record DashboardStats(
            List<Integer> weeklyParticipation,
            List<Double> paceMinutesPerKm,
            int runnersLast24h,
            double seoulHonorIndexDeltaPercent,
            List<HeatPoint> heatPoints
    ) {}
}
