package org.example.trainback.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

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

    @GetMapping
    public ResponseEntity<?> getSubwayInfo(
            @RequestParam String station,
            @RequestParam(required = false) String direction) {

        // 역 이름이 없을 경우 오류 반환
        if (station == null || station.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "역 이름을 입력하세요."));
        }

        // 요청 로그
        System.out.println("Requested station: " + station);
        System.out.println("Requested direction: " + direction);

        // 서울시 지하철 API URL 생성
        String url = UriComponentsBuilder.fromHttpUrl("http://swopenapi.seoul.go.kr/api/subway/" + apiKey + "/json/realtimeStationArrival/0/5/")
                .queryParam("station", station)
                .toUriString();

        try {
            // API 호출
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            // API 응답이 없다면 빈 리스트 반환
            if (response.getBody() == null || response.getBody().get("realtimeArrivalList") == null) {
                return ResponseEntity.ok(Map.of("station", station, "trains", List.of()));
            }

            // 열차 정보 리스트 가져오기
            List<Map<String, Object>> trains = (List<Map<String, Object>>) response.getBody().get("realtimeArrivalList");

            // 방향이 주어졌다면 해당 방향으로 필터링
            if (direction != null && !direction.isEmpty()) {
                trains = trains.stream()
                        .filter(train -> {
                            String trainLineNm = (String) train.get("trainLineNm");
                            return trainLineNm != null && trainLineNm.equals(direction); // 정확히 일치하는 경우만 필터링
                        })
                        .collect(Collectors.toList());
            }


            // 열차 정보 필터링
            List<Map<String, Object>> filteredTrains = trains.stream()
                    .map(train -> Map.of(
                            "trainLineNm", train.get("trainLineNm"),
                            "arvlMsg2", train.get("arvlMsg2"),
                            "arvlMsg3", train.get("arvlMsg3"),
                            "recptnDt", train.get("recptnDt")
                    ))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of("station", station, "trains", filteredTrains));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "API 요청 실패"));
        }
    }
}
