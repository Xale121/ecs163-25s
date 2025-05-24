// Alexander Fraties
// Homework 3

// Disclosure: ChatGPT was used for this project, as adhering to the syllabus. 
// It was used for javascript or D3 that was not covered much, similar to HW2, 
// like assigning a variable to brush. The code was also based off of the examples 
// in the provided resources or taken directly from my HW2, though all code here 
// is either written or heavilly adapted by me to meet assignment guidelines. 


// call the draw function, so it actually draws when the page loads
draw();

// use even t listener with timeouts to ensure it only redraws
// after a moment
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(draw, 100);
});


// the main function
function draw() {

    // remove all the child elements of svg, clear last draw before new one
    d3.select("svg").selectAll("*").remove();


    const width  = window.innerWidth;
    const height = window.innerHeight;
    
    let g1Left = 0, g1Top = 20;
    let g1Margin = {top: 10, right: 30, bottom: 30, left: 60},
        g1Width = 400 - g1Margin.left - g1Margin.right,
        g1Height = 350 - g1Margin.top - g1Margin.bottom;

    let g2Left = 400, g2Top = 0;
    let g2Margin = {top: 30, right: 30, bottom: 30, left: 60},
        g2Width = 400 - g2Margin.left - g2Margin.right,
        g2Height = 350 - g2Margin.top - g2Margin.bottom;

    let g3Left = 0, g3Top = 400;
    let g3Margin = {top: 10, right: 30, bottom: 30, left: 60},
        g3Width = width - g3Margin.left - g3Margin.right,
        g3Height = height- 450 - g3Margin.top - g3Margin.bottom;


    // load the csv file, I chose the pokemon one. pass in the rows for 
    // processing and visualization
    d3.csv("data/pokemon_alopez247.csv").then(function(rows) {
    // bar chart showinf pokemon type distribution

    // make an object  and loop through to count how 
    // many pokemon are in each Type 1 catagory
    // create an empty object to count types
    var typeCountsMap = {};

    // loop through each row in the data
    for (var i = 0; i < rows.length; i++) {
    // get the first and second types
    var d = rows[i];
    var t1 = d["Type_1"];
    var t2 = d["Type_2"];

    // if Type_1 exists,
    if (t1) {
        // if the typeCountsMap already has an entry, increment
        if (typeCountsMap[t1]) {
            typeCountsMap[t1] = typeCountsMap[t1] + 1;
        } else { // if not, set to one
            typeCountsMap[t1] = 1;
        }
    }

    // if Type_2 exists, same thing
    if (t2) {
        if (typeCountsMap[t2]) {
            typeCountsMap[t2] = typeCountsMap[t2] + 1;
        } else {
            typeCountsMap[t2] = 1;
        }
    }
    }

    // turn the object into an array of objects, and sort them as seen in
    // example and in d3indepth.com/selections
    const typeCounts = Object.keys(typeCountsMap).map(function(type) {
        return { type: type, count: typeCountsMap[type] };
    }).sort(function(a, b) {
        return b.count - a.count;
    });

    // make and append the new group g1 for the bar chart
    const svg = d3.select("svg");
    const g1 = svg.append("g")
        .attr("width",  g1Width  + g1Margin.left + g1Margin.right)
        .attr("height", g1Height + g1Margin.top  + g1Margin.bottom)
        .attr("transform", "translate(" + (g1Left + g1Margin.left) + "," + (g1Top  + g1Margin.top)  + ")");

    // make a band scale for the y axis using scaleBand, maps the types to it
    const y = d3.scaleBand()
        .domain(typeCounts.map(function(d){ return d.type; }))
        .range([0, g1Height])
        .paddingInner(0.3)
        .paddingOuter(0.2);

    // make a linear scale on the x axis using scaleLinear, map the number of pokemon to it
    const x = d3.scaleLinear()
        .domain([0, d3.max(typeCounts, function(d){ return d.count; })])
        .range([0, g1Width])
        .nice();

    // append to the g1 group the newly created x and y 
    // axis to the left and bottom respectily 
    g1.append("g").call(d3.axisLeft(y));                   
    g1.append("g").attr("transform", "translate(0,"+g1Height+")").call(d3.axisBottom(x).ticks(5));

    // make the actual bars, and put one bar per pokemon type
    g1.selectAll("rect")
        .data(typeCounts)
        .enter().append("rect")
        .attr("y", function(d){ return y(d.type); })
        .attr("x", 0)
        .attr("width",function(d){ return x(d.count); })
        .attr("height",y.bandwidth())
        .attr("fill", "#69b3a2");

    // append a label for the x axis, right below it
    g1.append("text")
        .attr("x", g1Width / 2)
        .attr("y", g1Height + 28)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .text("Number of Pokemon");

    // append a label for the y axis, rotated on left side
    g1.append("text")
        .attr("x", -(g1Height / 2))
        .attr("y", -80)
        .attr("font-size", "16px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Primary Type (Type 1)");
  
    // set up the interaction for the bar chart 
    g1.selectAll("rect")
    // mouse curser to pointer on hover, and when clicked store
    // type in chosen variable
    .style("cursor", "pointer")  
    .on("click", function(d) {
        var chosen = d.type;

        // apply visual highlight to this bar and remove from others
        g1.selectAll("rect").classed("active", function(b) {
        return b.type === chosen;
        });

        // insert css into document, so it's styled with highlight 
        d3.select("head")
        .append("style")
        .text("rect.active { stroke: black; stroke-width: 2px; fill: #4CAF50; }");

        // filter dataset to only have pokemon whos type matches the one selected
        var subset = [];
        for (var i = 0; i < rows.length; i++) {
            var p = rows[i];
            if (p.Type_1 === chosen || p.Type_2 === chosen) {
                subset.push(p);
            }
        }

        // animate the scatterplot for only the selected type to stand out
        g2.selectAll("circle")
        .transition()
        .duration(300)
        .style("opacity", function(p) {
            // if it's the selected type, make it's opacity 1
            if (p.Type_1 === chosen || p.Type_2 === chosen) {
                return 1;
                } else { // otherwise, it's 0.1 
                return 0.1;
            }
        });

        // update the parallel coordinates vis so it only uses the filtered set
        updateParallel(subset);
    })
    // reset filters and visuals on double click 
    .on("dblclick", function() {
        // remove active class from bars in chart
        g1.selectAll("rect").classed("active", false);

        // make it so the scatterplot is fully visable again 
        g2.selectAll("circle")
        .transition()
        .duration(300)
        .style("opacity", 0.7);

        // bring back all the lines by passing in all the rows 
        updateParallel(rows);
    });

    
        
    // append a title above the chart
    g1.append("text")
        .attr("x", g1Width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Overview: Distribution of Pokemon by Type");


    // scatter plot showing base stat strength vs. catch rate

    // convert the total and catch rate columns from strings into usable numbers 
    rows.forEach(function (d) {
    d.Total       = Number(d.Total);
    d.Catch_Rate  = Number(d.Catch_Rate);
    });

    // append the new g2 group to the svg to hold the scatter plot, and defeine it's dimentions
    const g2 = svg.append("g")
        .attr("width",  g2Width  + g2Margin.left + g2Margin.right)
        .attr("height", g2Height + g2Margin.top  + g2Margin.bottom)
        .attr("transform", "translate(" + (g2Left + g2Margin.left) + "," + (g2Top  + g2Margin.top)  + ")");

    // make a linear scale on the x axis using scaleLinear, map the total to it
    const xG2 = d3.scaleLinear()
        .domain([0, d3.max(rows, function(d){ return d.Total; })])
        .range([0, g2Width])
        .nice();

    // // make a linear scale on the y axis using scaleLinear, map the catch rate to it
    const yG2 = d3.scaleLinear()
        .domain([0, d3.max(rows, function(d){ return d.Catch_Rate; })])
        .range([g2Height, 0])
        .nice();


    // append to the g1 group the newly created x and y 
    // axis to the left and bottom respectily 
    g2.append("g").call(d3.axisLeft(yG2));
    g2.append("g").attr("transform", "translate(0," + g2Height + ")").call(d3.axisBottom(xG2));

    // append a label for the x axis, right below it
    g2.append("text")
        .attr("x", g2Width / 2)
        .attr("y", g2Height + 28)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Total Base Stats");

    // append a label for the y axis, rotated on left side
    g2.append("text")
        .attr("x", -(g2Height / 2))
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("transform", "rotate(-90)")
        .text("Catch Rate; Higher is Easier to Catch");

    // plot points for each pokemon using total and catch rate
    g2.selectAll("circle")
        .data(rows)
        .enter().append("circle")
        .attr("cx", function(d){ return xG2(d.Total); })
        .attr("cy", function(d){ return yG2(d.Catch_Rate); })
        .attr("r", 4)
        .attr("fill", function(d){ return "#73A5C6"; })
        .attr("opacity", 0.7);

    // makes the brush for the scatterplot
    var brush = d3.brush()
    .extent([[0, 0], [g2Width, g2Height]])
    .on("end", brushed);

    // append the brush to the scatterplot group
    g2.append("g")
    .attr("class", "brush")
    .call(brush);

    // define the brushed function, called on ending the brushing
    function brushed() {
        var selection = d3.event.selection;

        // if nothing is selected,
        if (selection === null) {
            // reset the scatterplot circles to how they where
            g2.selectAll("circle")
            .transition()
            .duration(300)
            .style("opacity", 0.7);

            // restore the full parallel coordinates
            updateParallel(rows);
            return;
        }

        // get the coordinates of the brush box
        var x0 = selection[0][0];
        var y0 = selection[0][1];
        var x1 = selection[1][0];
        var y1 = selection[1][1];

        // array for storing the pokemon in the brushed area
        var selected = [];
        
        // loop through the pokemon rows
        for (var i = 0; i < rows.length; i++) {
            // get the pokemon data and convert to coordinates
            var d = rows[i];
            var x = xG2(d.Total);
            var y = yG2(d.Catch_Rate);

            // if the coordinates fall fully in the box, 
            if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
                // push the pokemon into the array
                selected.push(d);
            }
        }

        // update the scatterplot
        g2.selectAll("circle")
            .transition()
            .duration(300)
            // set the opacity of each circle based on if it is 
            // in the coordinates
            .style("opacity", function(d) {
                var x = xG2(d.Total);
                var y = yG2(d.Catch_Rate);

                // if it's in the coordinates, 
                if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
                    return 1; // set opacity to 1 
                } else { // otherwise, set to 0.1
                    return 0.1;
                }
            });

        // update parallel coordinates to only 
        // have the pokemon from inside coordinates
        updateParallel(selected);
    }

    // reset the brush when double click
    g2.select(".brush")
    .on("dblclick", function() {
        // clear the brush from scatterplot
        g2.select(".brush").call(brush.move, null);

        // reset the scatterplot poi8nts to default
        g2.selectAll("circle")
        .transition()
        .duration(300)
        .style("opacity", 0.7);

        // restore the full parallel coordinates
        updateParallel(rows);
    });


    // append a title above the chart
    g2.append("text")
        .attr("x", g2Width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Catch Rate vs. Total Stats");


    // parallel coordinates showing stats of legendary vs regular pokemon

    // convert the columns from strings into usable numbers 
    rows.forEach(function(d){
    d.HP       = Number(d.HP);
    d.Attack   = Number(d.Attack);
    d.Defense  = Number(d.Defense);
    d.Sp_Atk   = Number(d.Sp_Atk);
    d.Sp_Def   = Number(d.Sp_Def);
    d.Speed    = Number(d.Speed);
    // ensure the TRUE is lower case, so it's read correctly from the file
    d.isLegendary = d.isLegendary.toLowerCase() === "true";
    });

    // these are the various stat dimentions we will need later
    const stats = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed"];

     // make a point scale on the x axis using scalePoint, map the stats to it 
    const xG3 = d3.scalePoint()
        .domain(stats)
        .range([0, g3Width])
        .padding(0.5);

    // make a linear scale on the y axis using scaleLinear, map the data to it
    const yG3 = {};
    stats.forEach(function(stat){
    yG3[stat] = d3.scaleLinear()
        .domain([d3.min(rows, d => d[stat]), d3.max(rows, d => d[stat])])
        .range([g3Height, 0]);});

    // use scaleOrdinal to map true to gold and false to grey
    const color = d3.scaleOrdinal()
        .domain([true, false])
        .range(["gold", "#bbb"]);

    // helper function to return make a line along all stats for one pokemon
    function path(d) {
    return d3.line()(stats.map(function(stat) {
        return [xG3(stat), yG3[stat](d[stat])];
    }));
    }

    // append the new g3 group to the svg to hold the parallel coordinates plot, and define dimensions
    const g3 = svg.append("g")
        .attr("width",  g3Width  + g3Margin.left + g3Margin.right)
        .attr("height", g3Height + g3Margin.top  + g3Margin.bottom)
        .attr("transform", "translate(" + (g3Left + g3Margin.left) + "," + (g3Top  + g3Margin.top)  + ")");

    // dedicated function to draw the line on graph for each pokemon, w/ legendary being gold
    function updateParallel(rows) {
        g3.selectAll("path").remove(); // Clear old lines
        g3.selectAll("path")
            .data(rows)
            .enter()
            .append("path")
            .transition().duration(300)
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", d => color(d.isLegendary))
            .attr("stroke-width", 1.2)
            .attr("opacity", 0.5);
    }
    updateParallel(rows);

    // loop through each stat and put g along x axis
    stats.forEach(function(stat) {
        const g = g3.append("g")
            .attr("transform", "translate(" + xG3(stat) + ",0)");

        // add y axis for each stat
        g.call(d3.axisLeft(yG3[stat]).ticks(5));

        // append a label for the various y axis, right above it
        g.append("text")
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .attr("font-size", "12px")
            .text(stat);
    });

    // append a title above the chart
    g3.append("text")
        .attr("x", g3Width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Stat Profile Across Pokemon");

    // append the group for the legend, for the parallel coordinates plot, bottom right corner
    const legend = g3.append("g")
        .attr("transform", `translate(${g3Width - 120}, ${g3Height - 30})`);

    // append to make a gold circle and also the Legendary text for the legend
    legend.append("circle").attr("r", 5).attr("fill", "gold");
    legend.append("text").attr("x", 10).attr("y", 5).text("Legendary");

    // do same thing with grey circle with Non-Legendary
    legend.append("circle").attr("r", 5).attr("fill", "#bbb").attr("cy", 20);
    legend.append("text").attr("x", 10).attr("y", 25).text("Non-Legendary");


    }).catch(function(err){
    console.error(err);
    });

    
}