import axios from "axios";

//holt die Karten-Schnittstell Daten vom Backend
const fetchData = () => {
  return axios
    .get("http://localhost:3001/daten/all")
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
      throw error;
    });
};

//Filtert die Daten, welche durch fetchData geliefert worden sind in Jahre
function getMapData(selectedYear) {
  return fetchData().then((daten) => {
    if (selectedYear) {
      daten = daten.filter((data) => data.jahr === selectedYear.toString());
    }
    return daten;
  });
}

export { getMapData };
