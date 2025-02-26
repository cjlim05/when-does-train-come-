package org.example.trainback.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/subway")
@CrossOrigin
public class SubwayController {

    @Value("${subway.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // 서울시 API에서 사용하는 subwayId 매핑
    private static final Map<String, String> LINE_NAME_TO_ID = Map.ofEntries(
            Map.entry("01호선", "1001"),
            Map.entry("02호선", "1002"),
            Map.entry("03호선", "1003"),
            Map.entry("04호선", "1004"),
            Map.entry("05호선", "1005"),
            Map.entry("06호선", "1006"),
            Map.entry("07호선", "1007"),
            Map.entry("08호선", "1008"),
            Map.entry("09호선", "1009"),
            Map.entry("경의중앙선", "1063"),
            Map.entry("공항철도", "1065"),
            Map.entry("신분당선", "1071"),
            Map.entry("수인분당선", "1075")
    );

    @GetMapping
    public ResponseEntity<?> getSubwayInfo(
            @RequestParam String station,
            @RequestParam String line) {

        if (station == null || station.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "역 이름을 입력하세요."));
        }
        if (line == null || !LINE_NAME_TO_ID.containsKey(line)) {
            return ResponseEntity.badRequest().body(Map.of("error", "올바른 호선을 입력하세요."));
        }

        String requestedSubwayId = LINE_NAME_TO_ID.get(line);

        String url = "http://swopenapi.seoul.go.kr/api/subway/" + apiKey + "/json/realtimeStationArrival/0/20/" + station;

        System.out.println("🔵 Request URL: " + url);
        System.out.println("🟢 Requested Station: " + station);
        System.out.println("🟢 Requested Line: " + line + " (SubwayId: " + requestedSubwayId + ")");

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            // ✅ API 응답 로그 추가
            System.out.println("🟡 API Response Status: " + response.getStatusCode());
            System.out.println("🟡 API Response Body: " + response.getBody());

            if (response.getBody() == null || response.getBody().get("realtimeArrivalList") == null) {
                return ResponseEntity.ok(Map.of("station", station, "trains", List.of()));
            }

            List<Map<String, Object>> trains = (List<Map<String, Object>>) response.getBody().get("realtimeArrivalList");

            // 🚀 필터링 전에 station과 subwayId 로그 찍기
            System.out.println("🟠 Filtering trains...");
            trains.forEach(train -> {
                System.out.println("Train statnNm: " + train.get("statnNm") + ", SubwayId: " + train.get("subwayId"));
            });

            List<Map<String, Object>> filteredTrains = trains.stream()
                    .filter(train -> station.trim().equals(String.valueOf(train.get("statnNm")).trim())) // trim() 추가
                    .filter(train -> requestedSubwayId.equals(String.valueOf(train.get("subwayId")))) // subwayId 필터링
                    .map(train -> Map.of(
                            "trainLineNm", train.get("trainLineNm"),
                            "arvlMsg2", train.get("arvlMsg2"),
                            "arvlMsg3", train.get("arvlMsg3"),
                            "recptnDt", train.get("recptnDt"),
                            "subwayId", train.get("subwayId"),
                            "statnNm", train.get("statnNm")
                    ))
                    .collect(Collectors.toList());

            // 🚀 필터링된 결과 출력
            System.out.println("🟠 Filtered trains: " + filteredTrains.size());

            return ResponseEntity.ok(Map.of("station", station, "trains", filteredTrains));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "API 요청 실패"));
        }
    }

}
