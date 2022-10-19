import "./style.css";
import * as d3 from "d3";

import { lineChart } from "./line_chart";
import { Int32, Table, Utf8 } from "apache-arrow";
import { db } from "./duckdb";
import parquet from "./air_qual.parquet?url";

const app = document.querySelector("#app")!;

const chart = lineChart();

async function update(City: string) {
  // Query DuckDB for the data we want to visualize.
  const data: Table<{ AQI: Int32; 
                      date: Utf8; 
                      HI: Int32; 
                      LO: Int32 }> = await conn.query(`
    SELECT AVG("US AQI") as AQI,
    quantile_cont("US AQI", 0.9) as HI,
    quantile_cont("US AQI", 0.1) as LO,
    strftime(date_trunc('month', "Timestamp(UTC)")+15, '%Y-%m') as date
    FROM air_qual.parquet
    WHERE City = '${City}'
    GROUP BY date
    ORDER BY date`);

  const raw: Table<{  day: Utf8;
                      daily_aqi: Int32 }> = await conn.query(`
    SELECT "US AQI" as raw_aqi,
    strftime("Timestamp(UTC)", '%Y-%m-%d') as raw_day
    FROM air_qual.parquet
    WHERE City = '${City}'`)
  console.log(raw)

  // Get the X and Y columns for the chart. Instead of using Parquet, DuckDB, and Arrow, we could also load data from CSV or JSON directly.
  const X = data
    .getChild("date")!
    .toJSON()
    .map((d) => `${d}`);
  const Y = data.getChild("AQI")!.toArray();
  const Y_h = data.getChild("HI")!.toArray();
  const Y_l = data.getChild("LO")!.toArray();
  const raw_day = raw
    .getChild("raw_day")!
    .toJSON()
    .map((d) => `${d}`);
  const raw_aqi = raw.getChild("raw_aqi")!.toArray();
  chart.update(X, Y, Y_l, Y_h, raw_day.length);
  chart.update_dots(raw_day, raw_aqi);
}

// Load a Parquet file and register it with DuckDB. We could request the data from a URL instead.
const res = await fetch(parquet);
await db.registerFileBuffer(
  "air_qual.parquet",
  new Uint8Array(await res.arrayBuffer())
);

// Query DuckDB for the locations.
const conn = await db.connect();

const locations: Table<{ city: Utf8 ; count : Int32 }> = await conn.query(`
  SELECT DISTINCT City, COUNT(City) as counts
  FROM air_qual.parquet
  GROUP by City`);

// Create a select element for the locations.
const select = d3.select(app).append("select");
for (const location of locations) {
  select.append("option").text(location.City + " (" + location.counts + ")")
}

select.on("change", () => {
  const location = select.property("value");
  update(location.split(" ")[0]);
});

// Update the chart with the first location.
update("Avalon");

// Add the chart to the DOM.
app.appendChild(chart.element);
