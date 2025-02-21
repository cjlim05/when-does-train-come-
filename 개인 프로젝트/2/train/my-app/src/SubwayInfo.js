import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Select from "react-select";

const SubwayInfo = () => {
  const [stations, setStations] = useState([]);
  const [directions, setDirections] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        const response = await fetch("/SubwayInfo.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const stationOptions = Array.from(new Set(jsonData.map(row => row["statnNm"])))
          .map(station => ({ value: station, label: station }));

        setStations(stationOptions);
      } catch (err) {
        console.error("Error reading Excel file", err);
      }
    };
    fetchExcelData();
  }, []);

  const handleStationChange = (selectedOption) => {
    setSelectedStation(selectedOption);
    setSelectedDirection(null);
    setData(null);

    fetch("/SubwayInfo.xlsx")
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const filteredDirections = Array.from(new Set(jsonData
          .filter(row => row["statnNm"] === selectedOption.value)
          .map(row => row["trainLineNm"])))
          .map(direction => ({ value: direction, label: direction }));

        setDirections(filteredDirections);
      });
  };

  const fetchSubwayData = async () => {
    if (!selectedStation) {
      setError("역 이름을 선택하세요.");
      return;
    }

    try {
      const response = await axios.get("http://localhost:8080/subway", {
        params: {
          station: selectedStation.value,
          direction: selectedDirection ? selectedDirection.value : undefined,
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
        <label>방향</label>
        <Select
          options={directions}
          value={selectedDirection}
          onChange={setSelectedDirection}
          isSearchable
          isDisabled={!selectedStation}
          placeholder="방향 선택"
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
