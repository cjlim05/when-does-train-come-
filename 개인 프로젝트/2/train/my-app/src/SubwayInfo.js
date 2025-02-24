import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Select from "react-select";

const SubwayInfo = () => {
  const [stations, setStations] = useState([]);
  const [lines, setLines] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [excelData, setExcelData] = useState([]); // 엑셀 데이터를 저장

  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        const response = await fetch("/SubwayInfo.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // 엑셀 데이터 저장
        setExcelData(jsonData);

        // 역 이름 목록 만들기 (중복 제거)
        const stationOptions = Array.from(new Set(jsonData.map(row => row["statnNm"])))
          .map(station => ({ value: station, label: station }));

        setStations(stationOptions);
      } catch (err) {
        console.error("Error reading Excel file", err);
      }
    };
    fetchExcelData();
  }, []);

  // 역 선택 시 노선 목록 업데이트
  const handleStationChange = (selectedOption) => {
    setSelectedStation(selectedOption);
    setSelectedLine(null);
    setData(null);

    // 선택한 역에 해당하는 노선(LineNm) 목록 필터링
    const filteredLines = Array.from(new Set(excelData
      .filter(row => row["statnNm"] === selectedOption.value)
      .map(row => row["lineNm"]))) // 'LineNm'으로 노선 선택
      .map(line => ({ value: line, label: line }));

    setLines(filteredLines);
  };

  // 실시간 도착 정보 가져오기
  const fetchSubwayData = async () => {
    if (!selectedStation) {
      setError("역 이름을 선택하세요.");
      return;
    }

    if (!selectedLine) {
      setError("노선을 선택하세요.");
      return;
    }

    try {
      // 엑셀 데이터에서 selectedStation과 selectedLine에 맞는 updnLine 값 찾기
      const selectedRow = excelData.find(row => row["statnNm"] === selectedStation.value && row["LineNm"] === selectedLine.value);

      if (!selectedRow) {
        setError("해당하는 데이터를 찾을 수 없습니다.");
        return;
      }

      const updnLine = selectedRow["updnLine"]; // 해당 역과 노선에 맞는 updnLine 값

      // 역 이름과 updnLine, LineNm을 API에 전달
      const response = await axios.get("http://localhost:8080/subway", {
        params: {
          station: selectedStation.value, // 선택한 역 이름 (statnNm)
          updnLine: updnLine, // 선택된 방향에 해당하는 updnLine 값
          line: selectedLine.value // 선택한 노선 (LineNm)
        },
      });
      setData(response.data.trains);
      setError("");
    } catch (err) {
      setError("데이터를 불러올 수 없습니다.");
      setData(null);
    }
  };

  return (
    <div>
      <h1>😇 서울 지하철 실시간 도착 정보</h1>
      
      <div>
        <label>역 이름</label>
        <Select
          options={stations}
          value={selectedStation}
          onChange={handleStationChange}
          isSearchable
          placeholder="역 이름 선택"
        />
      </div>
      
      <div>
        <label>호선</label>
        <Select
          options={lines}
          value={selectedLine}
          onChange={setSelectedLine}
          isSearchable
          isDisabled={!selectedStation}
          placeholder="호선 선택"
        />
      </div>
      
      <button type="button" onClick={fetchSubwayData}>
        조회
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && Array.isArray(data) && data.length > 0 ? (
        data.map((train, index) => (
          <div key={index}>
            <p>🚆 {train.trainLineNm}</p>
            <p>🕒 {train.arvlMsg2}</p>
            <p>📍 {train.arvlMsg3}</p>
            <p>⏰ {train.recptnDt}</p>
            <hr />
          </div>
        ))
      ) : (
        <p>현재 도착 정보가 없습니다.</p>
      )}
    </div>
  );
};
 
export default SubwayInfo;
