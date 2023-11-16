const express = require("express");
const axios = require("axios");
const app = express();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const nano = require("nano")("http://admin:admin@localhost:5984"); // URL zur CouchDB-Instanz
const databaseName = "open-government";
// Erstellt Datenbank
(async () => {
  try {
    const db = nano.db.use(databaseName);
    await nano.db.create(databaseName);
    console.log("Datenbank erfolgreich erstellt:", databaseName);
  } catch (err) {
    if (err.error === "file_exists") {
      console.log("Datenbank existiert bereits:", databaseName);
    } else {
      console.error("Fehler beim Erstellen der Datenbank:", err);
    }
  }
})();

// Holt Daten von Webseite und speichert sie in die Datenbank
function loadData() {
  axios
    .get(
      "https://data.tg.ch/api/v2/catalog/datasets/div-energie-12/exports/json"
    )
    .then((response) => {
      const data = response.data; // Speichere die Daten in einem JSON-Dokument
      const jsonDocument = {
        data: data,
      }; // Überprüfe, ob das Dokument bereits vorhanden ist
      const db = nano.db.use(databaseName);
      db.get("Daten", (err, body) => {
        if (!err) {
          // Dokument bereits vorhanden
          console.log("Das Dokument existiert bereits.");
        } else if (err.statusCode === 404) {
          // Dokument existiert noch nicht, füge es ein
          db.insert(jsonDocument, "Daten", (err, body) => {
            if (err) {
              console.error(err);
            } else {
              console.log("Dokument erfolgreich eingefügt.");
            }
          });
        } else {
          console.error(err);
        }
      });
    })

    .catch((error) => {
      console.error(error);
    });
}

app.get("/daten", (req, res) => {
  const db = nano.db.use(databaseName);
  db.list({ include_docs: true }, (err, body) => {
    if (err) {
      console.error(err);
      res.status(500).send("Interner Serverfehler");
      return;
    }

    //Daten werden aufsummiert, sodass sie in die Diagramme passen.
    const data = body.rows[0].doc.data;
    const summedData = {};
    data.forEach((item) => {
      const year = item.jahr;
      if (!summedData[year]) {
        summedData[year] = {
          oelfeuerungen: 0,
          erdgasfeuerungen: 0,
          elektroheizungen: 0,
          holzfeuerungen: 0,
          waermenetzanschluesse: 0,
          waermepumpen: 0,
          andere: 0,
        };
      }

      summedData[year].oelfeuerungen += item.oelfeuerungen;
      summedData[year].erdgasfeuerungen += item.erdgasfeuerungen;
      summedData[year].elektroheizungen += item.elektroheizungen;
      summedData[year].holzfeuerungen += item.holzfeuerungen;
      summedData[year].waermenetzanschluesse += item.waermenetzanschluesse;
      summedData[year].waermepumpen += item.waermepumpen;
      summedData[year].andere += item.andere;
    });

    const result = Object.entries(summedData).map(([year, values]) => ({
      jahr: year,
      ...values,
    }));

    res.send(result);
  });
});

app.get("/daten/all", (req, res) => {
  const db = nano.db.use(databaseName);
  db.list({ include_docs: true }, (err, body) => {
    if (err) {
      console.error(err);
      res.status(500).send("Interner Serverfehler");
      return;
    }

    //Schnittstelle von Karte

    const Gemeinde = [];
    for (let i = 0; i < body.rows[0].doc.data.length; i++) {
      const dataDBGemeinde = body.rows[0].doc.data[i];
      const Heizungen = {
        jahr: dataDBGemeinde.jahr,
        bfs_nr_gemeinde: dataDBGemeinde.bfs_nr_gemeinde,
        gemeinde_name: dataDBGemeinde.gemeinde_name,
        oelfeuerungen: dataDBGemeinde.oelfeuerungen,
        erdgasfeuerungen: dataDBGemeinde.erdgasfeuerungen,
        elektroheizungen: dataDBGemeinde.elektroheizungen,
        holzfeuerungen: dataDBGemeinde.holzfeuerungen,
        waermenetzanschluesse: dataDBGemeinde.waermenetzanschluesse,
        waermepumpen: dataDBGemeinde.waermepumpen,
        andere: dataDBGemeinde.andere,
        total: dataDBGemeinde.total,
      };
      Gemeinde.push(Heizungen);
    }
    res.send(Gemeinde);
  });
});

//Port läuft auf 3001
const port = 3001;
// Sorgt dafür, dass Daten nach backend-start sofort geladen werden.
loadData();
app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});
