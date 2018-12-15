var suicideCausesVisualizationApp = angular.module('suicideCausesVisualizationApp', []);
suicideCausesVisualizationApp.controller('suicideCausesVisualizationController', ['$scope', '$http', function($scope, $http) {  

    //data for first graph
    $scope.getDeathSumForAllTheCauses = function(){
        $http({
            method: 'GET',
            url: '/getDeathSumForAllTheCauses'
        }).then(function(response){
            $scope.causes = response.data;
            plotDeathSumForAllTheCausesWithSexSegregation();
        },function(error){

        });
    } 
    $scope.getDeathSumForAllTheCauses();

    //first graph - stacked bar graph
    function plotDeathSumForAllTheCausesWithSexSegregation(){
        //SVG
        var width = 1200, height = 500, margin = 35, margin_bottom = 200;
        var svg = d3.select("#first_graph")
        .append("svg")
        .attr("width",width+margin+margin).attr("height",height+margin+margin_bottom)
        .append("g").attr("transform","translate("+margin+","+margin+")");

        //var tooltip = d3.select("body").append("div").attr("class", "toolTip");
        var tooltip = d3.select(".stacked_bar_graph .toolTip");

        var x = d3.scaleBand()
            .rangeRound([0, width])
            .paddingInner(0.05)
            .align(0.1);
        var y = d3.scaleLinear()
            .rangeRound([height, 0]);
        var color = function(key){
            if(key == "Total_Male"){
                return "DeepSkyBlue"; 
            }else{
                return "HotPink";
            }
        }

        x.domain($scope.causes.map(function(d) { return d.name; }));
        y.domain([0, d3.max($scope.causes, function(d) { return d.Grand_Total; })]).nice();

        var stack = d3.stack()
        .keys(["Total_Male","Total_Female"])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);
        var layers = stack($scope.causes);
        
        svg.selectAll("g")
            .data(layers)
            .enter().append("g")
            .attr("fill", function(d) { 
                return color(d.key); })
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter().append("rect")
            .attr("x", function(d) { return x(d.data.name); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("height", function(d) { return y(d[0]) - y(d[1]); })
            .attr("width", x.bandwidth())
            .on("mousemove", function(d){
                var xPosition = d3.mouse(this)[0] - 5;
                var yPosition = d3.mouse(this)[1] - 5;
                tooltip
                  .style("left", d3.event.pageX - 50 + "px")
                  .style("top", d3.event.pageY - 70 + "px")
                  .style("display", "inline-block")
                  .html(d[1]-d[0]);
            })
                .on("mouseout", function(d){ tooltip.style("display", "none");});

        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")	
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y).ticks(null, "s"))
            .append("text")
            .attr("x", 2)
            .attr("y", y(y.ticks().pop()) + 0.5)
            .attr("dy", "0.32em")
            .attr("fill", "#000")
            .attr("font-weight", "bold")
            .attr("text-anchor", "start")
            .text("Number of Deaths");

        var legend = svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(["Total_Male","Total_Female"].slice().reverse())
            .enter().append("g")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
        legend.append("rect")
            .attr("x", width - 19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", color);
        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(function(d) { return d; });
    }

    $scope.ageGroups = ["Age_upto_14_years","Age_15_to_29_years","Age_30_to_44_years","Age_45_to_59_years","Age_above_60_years"];
    $scope.selectedAgeGroup = "Age_upto_14_years";

    //data for second graph
    $scope.getSuicideCausesByAgeGroup = function(){
        var parameters = {
            "age_group" : $scope.selectedAgeGroup
        };
        $http({
            method: 'GET',
            url: '/getSuicideCausesByAgeGroup/'+parameters.age_group
        }).then(function(response){
            $scope.suicideDataWithAge = response.data;
            plotYearVersusSuicideCountAsFunctionOfAgeGroup($scope.suicideDataWithAge);
        },function(error){

        });
    } 
    $scope.getSuicideCausesByAgeGroup();

    //second Graph - multiple line graph
    function plotYearVersusSuicideCountAsFunctionOfAgeGroup(suicideDataWithAge){

        //Data Processing
        var parseDate = d3.timeParse("%Y");
        suicideDataWithAge.forEach(function(d) {
                d.years = parseDate(d.years);
                d.total_of_age_group = +d.total_of_age_group;  
        });

        //Nesting        
        var suicideDataWithAge_Nest = d3.nest()
            .key(function(d) { return d.causes; })
            .entries(suicideDataWithAge);

        //SVG
        var width = 700, height = 700, margin = 35;
        $("#second_graph").empty(); //clear graph space
        var svg = d3.select("#second_graph")
        .append("svg")
        .attr("width",width+margin).attr("height",height+margin)
        .append("g").attr("transform","translate("+margin+","+margin+")");

        //Scale
        var xScale = d3.scaleTime()
        .domain(d3.extent(suicideDataWithAge_Nest[0].values, function(d){return d.years}))
        .range([0, width-300]);
        var yScale = d3.scaleLinear()
        .domain([0, 12162])
        .range([height-100, 0]);

        //Axes based on scale
        var x_axis = d3.axisBottom().scale(xScale);
        var y_axis = d3.axisLeft().scale(yScale);

        //Line Graph
        var color = d3.scaleOrdinal(d3.schemeSet1);

        var lineFunction = d3.line()
        .x(function(d) { return xScale(d.years); })
        .y(function(d) { return yScale(d.total_of_age_group); });
        
        var lines = svg.append('g')
        .attr('class', 'lines').attr("transform", "translate(50, 10)");

        lines.selectAll('.line-group')
        .data(suicideDataWithAge_Nest)
        .enter()
        .append('g')
        .attr('class', 'line-group') 
        .append('path')
        .attr('class', 'line')  
        .attr('d', function(d){return lineFunction(d.values)})
        .style('stroke', function(d,i){ return color(i) });

        /* for data points on line */
        var rectangle = {
            "opacity" : '0.85',
            'opacityOnHover' : '0.25',
            'length' : 6,
            'lengthOnHover' : 9
        };

        lines.selectAll(".rect-group")
        .data(suicideDataWithAge_Nest)
        .enter()
        .append("g")
        .style("fill", function(d,i){ return color(i)})
        .selectAll(".rect")
        .data(function(d){return d.values})
        .enter()
        .append("g")
        .attr("class", "rect")  
        .on("mouseover", function(d) {
            d3.select(this)     
                .style("cursor", "pointer")
                .append("text")
                .attr("class", "text")
                .text(d.total_of_age_group)
                .attr("x", function(d){ return xScale(d.years) + 5 })
                .attr("y", function(d){ return yScale(d.total_of_age_group) - 10 });
            })
        .on("mouseout", function(d) {
            d3.select(this)
                .style("cursor", "none")  
                .transition()
                .duration(250)
                .selectAll(".text").remove();
            })
        .append("rect")
        .attr("x", function(d){ return xScale(d.years)-rectangle.length/2;})
        .attr("y", function(d){ return yScale(d.total_of_age_group)-rectangle.length/2;})
        .attr("width", rectangle.length)
        .attr("height", rectangle.length)
        .style('opacity', rectangle.opacity)
        .on("mouseover", function(d) {
                d3.select(this)
                .transition()
                .duration(250)
                .attr("x", function(d){ return xScale(d.years)-(rectangle.lengthOnHover)/2;})
                .attr("y", function(d){ return yScale(d.total_of_age_group)-(rectangle.lengthOnHover)/2;})
                .attr("width", rectangle.lengthOnHover)
                .attr("height", rectangle.lengthOnHover);
            })
            .on("mouseout", function(d) {
                d3.select(this) 
                .transition()
                .duration(250)
                .attr("x", function(d){ return xScale(d.years)-rectangle.length/2;})
                .attr("y", function(d){ return yScale(d.total_of_age_group)-rectangle.length/2;})
                .attr("width", rectangle.length)
                .attr("height", rectangle.length);  
            });
        
        //label anchoring
        for(var i=0;i<5;i++){
            var data = suicideDataWithAge_Nest;
            lines.append("text")
            .attr("transform", "translate(" + xScale(data[i].values[data[i].values.length-1].years) + "," + yScale(data[i].values[data[i].values.length-1].total_of_age_group) + ")")
            .attr("dy", ".35em")
            .attr("dx",".35em")
            .attr("class","multi-line-text")
            .style("fill", color(i))
            .text(data[i].key)
        }

        svg.append("g")
           .attr("transform", "translate(50, 10)")
           .call(y_axis)
           .append('text')
           .attr("y", -45)
           .attr("transform", "rotate(-90)")
           .attr("fill", "#000")
           .text("Number of deaths");
        
        var xAxisTranslate = height-100 + 10;
        
        svg.append("g")
            .attr("transform", "translate(50, " + xAxisTranslate  +")")
            .call(x_axis)
            .append('text')
            .attr("x", width-300)
            .attr("y", 35)
            .attr("fill", "#000")
            .text("Years");


    };

    //data for map
    $scope.years = [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012];
    $scope.yearSelected = 2003;
    $scope.getSuicideDetailsOfAllTheStates = function(){
        $http({
            method: 'GET',
            url: '/getSuicideDetailsOfAllTheStates/' + $scope.yearSelected //'/getSuicideCausesByAgeGroup/'+parameters.age_group
        }).then(function(response){
            $scope.mapData = response.data;
            plotMap();
        },function(error){

        });
    } 
    $scope.getSuicideDetailsOfAllTheStates();

    //map
    function plotMap(){
        $("#third_graph").empty(); 

        var tooltip = d3.select(".map .tooltip");
        
        function tooltipHtml(num, name) {
            return "<h4>" + name + "</h4>" +
                "<h4> Toal deaths : " + num + "</h4>";
        }
    
        d3.json("json/IndiaStates.json").then(function(json) {
            
            for(var i=0;i<$scope.mapData.length;i++){
                for(var j=0; j<json.length; j++){
                    if($scope.mapData[i].State_Or_UT.toLowerCase() == json[j].n.toLowerCase()){
                        $scope.mapData[i].d = json[j].d;
                        $scope.mapData[i].id = json[j].id;
                    }
                }
            }

            var projection = d3.geoMercator()
                .scale(1)
                .translate([0, 0]);

            var path = d3.geoPath()
                .projection(projection);

            function mouseOver(d) {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(tooltipHtml(d.Grand_Total, d.State_Or_UT))
                    .style("left", (d3.event.layerX) + "px")
                    .style("top", (d3.event.layerY) + "px");
            }

            function mouseOut() {
                tooltip.transition().duration(200).style("opacity", 0);
            }

            var svg = d3.select("#third_graph")
                .append("svg")
                .attr("width", "50%")
                .attr("height", "100%")
                .append("g");

            var eS = svg.selectAll(".state")
                .data($scope.mapData)
                .enter()
                .append("g");
                
            eS.append("path")
                .attr("class", "state")
                .attr("d", function(d) {
                    return d.d;
                })
                .style("fill", function(d) {
                    var gt = d.Grand_Total;
                    return (gt>100000 ? "#b30000" : (gt>10000 ? "#e34a33" : (gt>1000 ?  "#fc8d59" : (gt>100 ? "#fdbb84" : (gt>10 ? "#fdd49e" : (gt>0 ? "#fef0d9" : "#fff"))))));
                })
                .on("mousemove", mouseOver).on("mouseout", mouseOut)
                
            eS.append("text")
                .attr("fill", "black")
                .attr("transform", function(d) {
                    var bbox = this.previousSibling.getBBox();
                    return "translate(" + (bbox.x + bbox.width/2) + "," + (bbox.y + bbox.height/2) + ")";
                })
                .attr("text-anchor", "middle")
                .attr("font-size","10px")
                .attr("dy", ".35em")
                .text(function(d) {
                    return d.id;
                });

            var colors = {
                ">1,00,000" : "#b30000",
                "99,999 > x > 10,000" : "#e34a33",
                "9,999 > x > 1,000" : "#fc8d59",
                "999 > x > 100" : "#fdbb84",
                "99 > x > 10" : "#fdd49e",
                "9 > x > 1" : "#fef0d9"
            };
            var getColor = function(key){
                return colors[key];
            }

            var legend = svg.append("g")
                .attr("font-family", "sans-serif")
                .attr("font-size", 10)
                .attr("text-anchor", "end")
                .selectAll("g")
                .data(d3.keys(colors).slice()) 
                .enter().append("g")
                .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
            legend.append("rect")
                .attr("x", 500 - 19) //width-19
                .attr("width", 19)
                .attr("height", 19)
                .attr("border","black")
                .attr("fill", getColor);
            legend.append("text")
                .attr("x", 500 - 24) //width-24
                .attr("y", 9.5)
                .attr("dy", "0.32em")
                .text(function(d) { return d; });

        });
    }

}]);
