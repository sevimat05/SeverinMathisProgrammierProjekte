import { getMapData } from "./energydataservices";

function addEventListeners() {
  const elTooltip = document.getElementById("tooltip-map");
  const mapContainer = document.getElementById("map-container");
  const yearSelect = document.getElementById("year-select");

  //Sobald Jahr ausgewählt werden andere Daten angezeigt
  yearSelect.addEventListener("change", () => {
    const selectedYear = parseInt(yearSelect.value);
    getMapData(selectedYear).then((daten) => {
      updateTooltips(daten);
    });
  });

  getMapData().then((daten) => {
    updateTooltips(daten);
  });

  function updateTooltips(daten) {
    const paths = document.querySelectorAll("#municipalities path");
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      //mouseenter ermöglicht das Hovern über die Map
      path.addEventListener("mouseenter", async (event) => {
        elTooltip.classList.remove("do-not-display");

        //ID der Map und ID der Daten werden verglichen
        const bfsNr = path.getAttribute("id");
        const gemeindeData = daten.find(
          (data) => data.bfs_nr_gemeinde === bfsNr
        );

        if (gemeindeData) {
          const {
            jahr,
            gemeinde_name,
            oelfeuerungen,
            erdgasfeuerungen,
            elektroheizungen,
            holzfeuerungen,
            waermenetzanschluesse,
            waermepumpen,
            andere,
            total,
          } = gemeindeData;
          elTooltip.innerHTML = `
            <h2>${gemeinde_name}</h2>
            <p>Jahr: ${jahr}</p>
            <p>Oelfeuerungen: ${oelfeuerungen}</p>
            <p>Erdgasfeuerungen: ${erdgasfeuerungen}</p>
            <p>Elektroheizungen: ${elektroheizungen}</p>
            <p>Holzfeuerungen: ${holzfeuerungen}</p>
            <p>Waermenetzanschluesse: ${waermenetzanschluesse}</p>
            <p>Waermepumpen: ${waermepumpen}</p>
            <p>Andere: ${andere}</p>
            <p>Total: ${total}</p>
          `;
        } else {
          elTooltip.innerHTML = "Keine Daten verfügbar";
        }

        elTooltip.style.top = `${event.pageY}px`;
        elTooltip.style.left = `${event.pageX}px`;
      });

      path.addEventListener("mouseleave", () => {
        elTooltip.classList.add("do-not-display");
      });
    }
  }
}

export { addEventListeners };
