import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Select from "react-select";
import "./subwayinfocss.css";

const Train = () => <div className="train-icon">🚆</div>;

const arrivalStatusMap = {
  "0": "진입",
  "1": "도착",
  "2": "출발",
  "3": "전역 출발",
  "4": "전역 도착",
};

const SubwayInfo = () => {
  const [stations, setStations] = useState([]);
  const [lines, setLines] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [excelData, setExcelData] = useState([]);

  useEffect(() => {
    const fetchExcelData = async () => {
      try {
        const response = await fetch("/SubwayInfo2.xlsx");
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setExcelData(jsonData);
        const stationOptions = Array.from(
          new Set(jsonData.map(row => row["statnNm"].trim().toLowerCase()))
        ).map(station => ({ value: station, label: station }));
        setStations(stationOptions);
      } catch (err) {
        console.error("Error reading Excel file", err);
      }
    };
    fetchExcelData();
  }, []);

  const handleStationChange = (selectedOption) => {
    setSelectedStation(selectedOption);
    setSelectedLine(null);
    setData(null);
    const filteredLines = Array.from(
      new Set(
        excelData
          .filter(row => row["statnNm"].trim().toLowerCase() === selectedOption.value)
          .map(row => row["lineNm"])
      )
    ).map(line => ({ value: line, label: line }));
    setLines(filteredLines);
  };

  const fetchSubwayData = async () => {
    if (!selectedStation || !selectedLine) {
      setError("역과 노선을 선택하세요.");
      return;
    }

    try {
      const response = await axios.get("http://localhost:8080/subway", {
        params: {
          station: selectedStation.value,
          line: selectedLine.value//fjf
        },
      });
      setData(response.data.trains);
      setError("");
    } catch (err) {
      console.error("Error fetching subway data:", err);
      setError("데이터를 불러올 수 없습니다.");
      setData(null);
    }
  };

  const getDirection = (trainLineNm) => {
    const match = trainLineNm.match(/- (\S+방면)/);
    return match ? match[1] : null;
  };

  const getPreviousStations = (currentStation, direction, line) => {
    // 현재 방향(상행 or 하행)에 맞는 데이터만 필터링
    const filteredExcelData = excelData.filter(row => row.updnLine === direction && row.lineNm === line);
    console.log(line)

    const prevStation = filteredExcelData.find(row => row.statnNm === currentStation)?.statnFid;
    console.log("정거장 이름: " +prevStation)
    const prevStationName = filteredExcelData.find(row => String(row.statnId) === String(prevStation))?.statnNm || "알 수 없음";
    console.log("정거장 이름: " +prevStationName)
  
    const prevPrevStation = filteredExcelData.find(row => String(row.statnId) === String(prevStation))?.statnFid;
    const prevPrevStationName = filteredExcelData.find(row => String(row.statnId) === String(prevPrevStation))?.statnNm || "알 수 없음";
  
    return { prevStationName, prevPrevStationName };
  };
  
  const renderTrainInfo = (direction) => {
    const filteredTrains = data.filter(train => train.updnLine === direction);
    if (filteredTrains.length === 0) return null;
  
    const firstTrain = filteredTrains[0]; // 첫 번째 열차 기준
    const { prevStationName, prevPrevStationName } = getPreviousStations(firstTrain.statnNm, direction, selectedLine.value);
  
    return (
      <>
        <h2>{getDirection(firstTrain.trainLineNm)}</h2>
        <div className="line-with-circles">
          <div className="line"></div>
          <div className="circle-container">
            {[prevPrevStationName, prevStationName, firstTrain.statnNm].map((station, i) => (
              <div key={`${direction}-circle-${i}`} className="station-label">
                <div className="circle">
                  {data.some(train => train.updnLine === direction && train.statnNm === station) && <Train />}
                </div>
                <span>{station}</span>
              </div>
            ))}
          </div>
        </div>
        {filteredTrains.map((train, index) => (
          <div key={`${direction}-${index}`}>
            <p>🚆 {train.trainLineNm}</p>
            <p>🕒 {train.arvlMsg2}</p>
            <p>📍 현재 위치: {train.arvlMsg3}</p>
            {arrivalStatusMap.hasOwnProperty(train.arvlCd) && (
              <p>⏰ {arrivalStatusMap[train.arvlCd]}</p>
            )}
            <hr />
          </div>
        ))}
      </>
    );
  };
  
  
  return (
    <div>
      <h1>😇 서울 지하철 실시간 도착 정보</h1>
      <div>
        <label>역 이름</label>
        <Select options={stations} value={selectedStation} onChange={handleStationChange} isSearchable placeholder="역 이름 선택" />
      </div>
      <div>
        <label>호선</label>
        <Select options={lines} value={selectedLine} onChange={setSelectedLine} isSearchable isDisabled={!selectedStation} placeholder="호선 선택" />
      </div>
      <button type="button" onClick={fetchSubwayData}>조회</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {data && (
        <>
          {renderTrainInfo("상행")}
          {renderTrainInfo("하행")}
        </>
      )}
    </div>
  );
  
};

export default SubwayInfo;
