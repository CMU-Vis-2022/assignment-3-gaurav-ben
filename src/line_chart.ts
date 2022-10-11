import * as d3 from "d3";

export function lineChart() {
    const margin = { top: 30, right: 0, bottom: 30, left: 50 };
    const width = document.body.clientWidth;
    const height = 500;

    const xRange = [margin.left, width - margin.right];
    const yRange = [height - margin.bottom, margin.top];

    // Construct scales and axes.
    const xScale = d3.scaleTime().range(xRange);
    const yScale = d3.scaleLinear().range(yRange);

    const xAxis = d3.axisBottom(xScale).ticks(width / 80);
    const yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

    // Create the SVG element for the chart.
    const svg = d3
        .create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    // Add the x axis
    svg
        .append("g")
        .attr("class", "xaxis")
        .attr("transform", `translate(0,${height-margin.bottom})`);

    // Add the y axis
    svg
        .append("g")
        .attr("class", "yaxis")
        .attr("transform", `translate(${margin.left},0)`);

    // Add the line
    const line = svg
        .append("path")
        .attr("class", "line")
        .attr("stroke", "#000000")
        .attr("stroke-width", 1.5)
        .attr('fill', 'none');
    // Add area
    const area = svg
        .append("path")
        .attr("class", "area")
        .attr("fill", "#cce5df")
        .attr("stroke", "none")
        .attr("opacity", 0.4);

    // Add mouseover line
    const m_line = svg
        .append("g")
        .append('rect')
            .style("stroke-width", "1px")
            .attr('width', "0.5px")
            .attr("stroke", "black")
            .style("opacity", 0)
            .attr("height", height - margin.bottom);
    // Add mouseover text
    const m_text = svg
        .append("g")
        .append("text")
            .style("opacity", 0)
            .attr("text-anchor", "left")
            .attr("alighment-baseline", "middle");
    
    // Adding mouseover detector
    var m_box = svg.append("rect")
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr("width", width)
        .attr("height", height)
        .on("mouseover", function() {
            m_line.style("opacity", 1);
            m_text.style("opacity", 1);
        })
        .on("mouseout", function() {
            m_line.style("opacity", 0);
            m_text.style("opacity", 0); 
        });
    function update(X: string[], 
                    Y: Int32Array, 
                    Y_l: Int32Array | Uint8Array, 
                    Y_h: Int32Array | Uint8Array) {
        // Here we use an array of indexes as data for D3 so we can process columnar data more easily
        // but you could also directly pass an array of objects to D3.
        xScale.domain([new Date(X[0]), new Date(X[X.length - 1])]);
        yScale.domain([0, 160]);

        // Turning inputs into data
        var data = [];
        for (var i = 0; i < X.length; i++) {
            data.push({
                date: new Date(X[i]),
                aqi: Y[i],
                aqi_lo: Y_l[i],
                aqi_hi: Y_h[i]
            });
        }

        // Setting mouse move function
        m_box.on("mousemove", mousemove)
        function mousemove() {
            var x0 = xScale.invert(d3.pointer(event)[0]);
            var i = bisect(data, x0, 1);
            var selectedData = data[i];
            var m_date = X[i];
            m_line
                .attr("x", xScale(selectedData.date))
            m_text
                .html("<tspan dy='1.2em'>" + m_date + "-15" + "</tspan>" 
                    + "<tspan dx='-5.2em' dy='1.2em'>" + "Mean US AQI: " + selectedData.aqi.toFixed(2) + "</tspan>")
                .attr("x", xScale(selectedData.date))
                .attr("y", yScale(selectedData.aqi+15))
        }
        // Updating the line
        var my_line = d3.line()
            .x(function (d: any) { return xScale(d.date); }) // apply the x scale to the x data
            .y(function (d: any) { return yScale(d.aqi); }) // apply the y scale to the y data
        line.attr("d", my_line(data));
        
        // Updating the area
        var my_area = d3.area()
            .x(function (d: any) { return xScale(d.date) })
            .y0(function (d: any) { return yScale(d.aqi_lo) })
            .y1(function (d: any) { return yScale(d.aqi_hi) });
        area.attr("d", my_area(data));

        // Clear the axis so that when we add the grid, we don't get duplicate lines
        svg.select(".xaxis").selectAll("*").remove();

        // Updating mouse position
        var bisect = d3.bisector(function (d : any) { return d.date}).left
        
        // Update axes since we set new domains
        svg
            .select<SVGSVGElement>(".xaxis")
            .call(xAxis)
            // add gridlines
            .call((g) =>
                g
                    .selectAll(".tick line")
                    .clone()
                    .attr("y2", height - margin.top - margin.bottom)
                    .attr("stroke-opacity", 0.1)
            )
            .call((g) =>
                g
                    .append("text")
                    .attr("x", width - margin.right)
                    .attr("y", 0)
                    .attr("fill", "black")
                    .attr("text-anchor", "end")
                    .text("Year")
            );

        svg.select<SVGSVGElement>(".yaxis").call(yAxis);
    }

    return {
        element: svg.node()!,
        update,
    };
}