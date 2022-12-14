import * as d3 from "d3";
import * as d3r from "d3-regression";

export function p2Chart() {
  let data: any = [];
  let raw_data: any = [];
  const tl_text = document.getElementById("regression");
  const regression = d3r
    .regressionPoly()
    .x((d) => d.new_x)
    .y((d) => d.aqi)
    .order(4);
  let tl_arr = regression(data);
  const margin = { top: 30, right: 0, bottom: 30, left: 50 };
  const width = document.body.clientWidth;
  const height = 500;
  const xRange = [margin.left, width - margin.right];
  const yRange = [height - margin.bottom, margin.top];

  // Construct scales and axes.
  const xScale = d3.scaleLinear().range(xRange);
  const yScale = d3.scaleLinear().range(yRange);

  const xAxis = d3.axisBottom(xScale).ticks(width / 80);
  const yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

  // Create the base_layer element for the chart.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  // Getting text to display on top
  const base_layer = svg.append("g");
  const trend_layer = svg.append("g");
  const text_layer = svg.append("g");

  // Creating the background
  const bg_arr = [
    { name: "Good", min: 0, max: 50, color: "#9cd84e" },
    { name: "Moderate", min: 51, max: 100, color: "#facf39" },
    {
      name: "Unhealthy for Sensitive Groups",
      min: 101,
      max: 150,
      color: "#f99049",
    },
    { name: "Unhealthy", min: 151, max: 200, color: "#f65e5f" },
    { name: "Very Unhealthy", min: 201, max: 300, color: "#a070b6" },
    { name: "Hazardous", min: 301, color: "#a06a7b" },
  ];
  yScale.domain([0, 160]);
  const bar_height = yScale(0) - yScale(50);
  base_layer
    .append("rect")
    .attr("x", margin.left)
    .attr("y", yScale(bg_arr[0].min + 51))
    .attr("width", width - margin.left - margin.right)
    .attr("height", bar_height + 2)
    .attr("fill", bg_arr[0].color)
    .attr("opacity", 0.5);
  for (let i = 1; i < 3; i++) {
    const c_elem = bg_arr[i];
    base_layer
      .append("rect")
      .attr("x", margin.left)
      .attr("y", yScale(c_elem.min + 50))
      .attr("width", width - margin.left - margin.right)
      .attr("height", bar_height)
      .attr("fill", c_elem.color)
      .attr("opacity", 0.5);
  }
  base_layer
    .append("rect")
    .attr("x", margin.left)
    .attr("y", yScale(160))
    .attr("width", width - margin.left - margin.right)
    .attr("height", yScale(0) - yScale(9))
    .attr("fill", bg_arr[3].color)
    .attr("opacity", 0.5);

  // Add the x axis
  base_layer
    .append("g")
    .attr("class", "xaxis")
    .attr("transform", `translate(0,${height - margin.bottom})`);

  // Add the y axis
  base_layer
    .append("g")
    .attr("class", "yaxis")
    .attr("transform", `translate(${margin.left},0)`);

  // Add area
  const area = base_layer
    .append("path")
    .attr("class", "area")
    .attr("fill", "#A0A0A0")
    .attr("stroke", "none")
    .attr("opacity", 0.7);
  // Add the line
  const line = base_layer
    .append("path")
    .attr("class", "line")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("fill", "none")
    .attr("opacity", 1);

  // Add the trendline
  const trendline = trend_layer
    .append("path")
    .attr("class", "line")
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("fill", "none")
    .attr("opacity", 0);

  // Add mouseover line
  const m_line = base_layer
    .append("g")
    .append("rect")
    .style("stroke-width", "1px")
    .attr("width", "0.5px")
    .attr("stroke", "black")
    .style("opacity", 0)
    .attr("y", margin.top)
    .attr("height", height - margin.bottom - margin.top);

  // Add mouseover text
  const m_text = text_layer
    .append("g")
    .append("text")
    .style("opacity", 0)
    .style("font", "16px")
    .attr("class", "glow")
    .attr("text-anchor", "right")
    .attr("alignment-baseline", "right");

  // Adding mouseover detector
  const m_box = text_layer
    .append("rect")
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr("width", width + 10)
    .attr("height", height + 10)
    .on("mouseover", function () {
      m_line.style("opacity", 1);
      m_text.style("opacity", 1);
    })
    .on("mouseout", function () {
      m_line.style("opacity", 0);
      m_text.style("opacity", 0);
    });

  // Toggling scatterplot on and off
  function togglePts() {
    // Update dots set
    const pts: any = base_layer.selectAll(".dots").data(raw_data);

    // Removing old points
    pts.exit().remove();

    // Making new points
    let new_opacity = 0;
    if (d3.select("#show_raw2").property("checked")) {
      new_opacity = 0.8;
    }
    pts
      .enter()
      .append("circle")
      .attr("class", "dots")
      .merge(pts)
      .attr("cx", function (d: any) {
        return xScale(d.raw_x);
      })
      .attr("cy", function (d: any) {
        return yScale(d.aqi);
      })
      .attr("r", 1.5)
      .style("opacity", new_opacity);
  }

  function toggleTrendline() {
    const checkbox = d3.select("#show_trend");
    if (checkbox.property("checked")) {
      trendline.style("opacity", 1);
      base_layer.style("opacity", 0.5);
      tl_text.innerHTML = "R<sup>2</sup> = " + tl_arr.rSquared.toFixed(3);
    } else {
      trendline.style("opacity", 0);
      base_layer.style("opacity", 1);
      tl_text.innerHTML = "";
    }
  }

  d3.select("#show_raw2").on("change", togglePts);
  d3.select("#show_trend").on("change", toggleTrendline);
  // Updates the scatterplot
  function update_dots(X: Int32Array | Uint8Array, Y: Int32Array | Uint8Array) {
    raw_data = [];
    for (let i = 0; i < X.length; i++) {
      raw_data.push({
        raw_x: X[i],
        aqi: Y[i],
      });
    }
    // Update dots set
    const pts: any = base_layer.selectAll(".dots").data(raw_data);

    // Removing old points
    pts.exit().remove();

    // Making new points
    let new_opacity = 0;
    if (d3.select("#show_raw2").property("checked")) {
      new_opacity = 0.8;
    }
    pts
      .enter()
      .append("circle")
      .attr("class", "dots")
      .merge(pts)
      .attr("cx", function (d: any) {
        return xScale(d.raw_x);
      })
      .attr("cy", function (d: any) {
        return yScale(d.aqi);
      })
      .attr("r", 1.5)
      .style("opacity", new_opacity);
  }

  function update(
    X: any,
    aqi: Int32Array | Uint8Array,
    aqi_10: Int32Array | Uint8Array,
    aqi_90: Int32Array | Uint8Array,
    units: string
  ) {
    // Creating new X and Y domains
    X = X.filter(function (value: any) {
      return !Number.isNaN(value);
    });
    const min = Math.min(...X);
    const max = Math.max(...X);
    xScale.domain([min, max]);
    yScale.domain([0, 160]);

    // Turning inputs into data
    data = [];
    for (let i = 0; i < X.length; i++) {
      data.push({
        new_x: X[i],
        aqi: aqi[i],
        aqi_lo: aqi_10[i],
        aqi_hi: aqi_90[i],
      });
    }

    tl_arr = regression(data);
    const my_trendline = d3
      .line()
      .x(function (d: any) {
        return xScale(d[0]);
      })
      .y(function (d: any) {
        return yScale(d[1]);
      });
    trendline.merge(trendline).attr("d", my_trendline(tl_arr));

    // Setting mouse move function
    m_box.on("mousemove", mousemove);
    function mousemove() {
      const x0 = xScale.invert(d3.pointer(event)[0]);
      const i = bisect(data, x0, 1);
      const selectedData = data[i];
      let x_pos = xScale(X[i]);
      if (x_pos + 150 > width) {
        x_pos -= 155;
      }
      m_line.attr("x", xScale(X[i]) - 5);
      m_text
        .html(
          "<tspan dy='1.2em'>" +
            X[i] +
            " " +
            units +
            "</tspan>" +
            "<tspan dx='-5.2em' dy='1.2em'>" +
            "Mean US AQI: " +
            selectedData.aqi.toFixed(2) +
            "</tspan>"
        )
        .attr("x", x_pos)
        .attr("y", yScale(selectedData.aqi + 15))
        .on("mouseenter", function () {
          d3.select(this).raise();
        });
    }

    // Updating the line
    const my_line = d3
      .line()
      .curve(d3.curveCardinal)
      .x(function (d: any) {
        return xScale(d.new_x);
      }) // apply the x scale to the x data
      .y(function (d: any) {
        return yScale(d.aqi);
      }); // apply the y scale to the y data
    line.merge(line).attr("d", my_line(data));

    // Updating the area
    const my_area = d3
      .area()
      .curve(d3.curveMonotoneX)
      .x(function (d: any) {
        return xScale(d.new_x);
      })
      .y0(function (d: any) {
        return yScale(d.aqi_lo);
      })
      .y1(function (d: any) {
        return yScale(d.aqi_hi);
      });

    area.merge(area).attr("d", my_area(data));

    // Clear the axis so that when we add the grid, we don't get duplicate lines
    base_layer.select(".xaxis").selectAll("*").remove();

    // Updating mouse position
    const bisect = d3.bisector(function (d: any) {
      return d.new_x;
    }).left;

    // Update axes since we set new domains
    base_layer.select<SVGSVGElement>(".xaxis").call(xAxis);

    base_layer
      .select<SVGSVGElement>(".yaxis")
      .call(yAxis)
      // add gridlines
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", width - margin.left - margin.right)
          .attr("stroke-opacity", 0.08)
      );
  }

  return {
    element: svg.node()!,
    update,
    update_dots,
  };
}
