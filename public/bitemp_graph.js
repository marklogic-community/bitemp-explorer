/*global d3, moment*/

var barChart = function() {
  // default values for configurable input parameters
  var width = 600;
  var height = 300;
  var uri, isEditing, isViewing, isDeleting;
  var xMin = null;
  var xMax = null;
  var yMin = null;
  var yMax = null;
  var draggableBars;
  var displayProperty = '';
  var lastDoc;
  var data;
  var displayedProps = [];
  var background;

  var systemStart, systemEnd, validStart, validEnd;

  var margin = {
    top: 0,
    right: 0,
    bottom: 150,
    left: 170
  };
  var xAxisLabel = 'System Time';
  var yAxisLabel = 'Valid Time';

  var color = d3.scale.category10();

  var xScale, xAxis, xAxisCssClass;
  var yScale, yAxis, g;
  var axisLabelMargin;

  function getAxisSetup() {
    var uriInGraph;
    console.log("AXISSETUP");
    if(data.length > 0) {
      //get a uri of one of the physical documents being displayed
      for(var i = 0; i < data.length && !uriInGraph; i++) {
        if(data[i].uri) {
          uriInGraph = data[i].uri;
        }
      }
      if(uriInGraph !== undefined) {
        //find the emcompassing collection that the phys doc belongs to.
        var commonColl = getDocColls(uriInGraph);
        commonColl = commonColl.collections;
        var temporalColl = getTemporalColl(uriInGraph);
        temporalColl = temporalColl['temporal-collection-default-list']['list-items']['list-item'];
        var myTempColl = findCommonColl(commonColl, temporalColl);
        $.ajax({
          url: '/v1/resources/axisSetup?rs:collection=' + myTempColl,
          async: false,
          success: function(response, textStatus) {
            systemStart = response.sysStart;
            systemEnd = response.sysEnd;
            validStart = response.valStart;
            validEnd = response.valEnd;
          },
          error: function(jqXHR, textStatus, errorThrown) {
            console.log('problem: ' + errorThrown);
          }
        });
      }
    }
  }

  var chart = function(container) {

    function setupXAxis() {
      // minStart: earliest system start
      // maxEnd: latest non-infinty system end
      // maxStart: max system start time
      var minStart, maxEnd, maxStart;

      if (xMin) {
        minStart = xMin;
      }

      else {
        if (data.length) {
          minStart =  moment.min(data.map(function(d){
            return moment(d.content[systemStart]);
          })).toDate();
        }
        else {
          minStart = moment('2001-01-01T00:00:00').toDate();
        }
      }

      maxStart =
        moment.max(data.map(function(d){
          return moment(d.content[systemStart]);
        })).add(10, 'y');

      if (xMax) {
        maxEnd = xMax;
      }
      else {
        if (data.length > 0) {
          maxEnd =
            moment.max(data.map(function(d){
              if (d.content[systemEnd].startsWith('9999')) {
                return maxStart;
              }
              else {
                return moment(d.content[systemEnd]);
              }
            })).add(5, 'y').toDate();
        }
        else {
          maxEnd = moment('2020-01-01T00:00:00').toDate();
        }
      }

      maxStart = maxStart.toDate();

      if(maxStart > maxEnd) {
        maxEnd = maxStart;
      }

      xScale = d3.time.scale()
        .domain([minStart, maxEnd])
        .range([axisLabelMargin,width-margin.left-margin.right-axisLabelMargin]);

      if (data.length > 12 && width < 500) {
        xAxisCssClass = 'axis-font-small';
      } else {
        xAxisCssClass = '';
      }

      xAxis = d3.svg.axis()
        .scale(xScale)
        .ticks(10)
        .tickFormat(d3.time.format('%Y-%m-%d'))
        .tickSize(10,0)
        .orient('end');

    }

    function setupYAxis() {
      // minStart: earliest valid start
      // maxEnd: latest non-infinty valid end
      // maxStart: max valid start time
      var minStart, maxEnd, maxStart;

      if (yMin) {
        minStart = yMin;
      }
      else {
        if (data.length) {
          minStart =
            moment.min(data.map(function(d){
              return moment(d.content[validStart]);
            })).toDate();
        }
        else {
          minStart = moment('2001-01-01T00:00:00').toDate();
        }
      }
      maxStart =
        moment.max(data.map(function(d){
          return moment(d.content[validStart]);
        })).add(10, 'y');

      if (yMax) {
        maxEnd = yMax;
      }
      else {
        if (data.length) {
          maxEnd =
            moment.max(data.map(function(d){
              if (d.content[validEnd].startsWith('9999')) {
                return maxStart;
              }
              else {
                return moment(d.content[validEnd]);
              }
            })).toDate();
        }
        else {
          maxEnd = moment('2015-01-01T00:00:00').toDate();
        }
      }

      yScale = d3.time.scale()
        .domain([minStart, maxEnd])
        .range([height - axisLabelMargin - margin.top - margin.bottom, axisLabelMargin]);

      var yAxisCssClass;
      if (data.length > 12 && width < 500) {
        yAxisCssClass = 'axis-font-small';
      } else {
        yAxisCssClass = '';
      }

      yAxis = d3.svg.axis()
        .scale(yScale)
        .orient('left')
        .tickFormat(d3.time.format('%Y-%m-%d'))
        .tickSize(10,0);
    }

    function setupBarChartLayout() {

      g = container.append('svg')
        .attr('class', 'svg-chart')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      var colorDomain = [];
      data.map(function(d){
        colorDomain.push(d.content.data);
      });

      color.domain(colorDomain);
    }

    function addXAxisLabel() {
      //Rotate ticks
      g.append('g')
        .attr('class', 'xaxis ' + xAxisCssClass)
        .attr('transform', 'translate(0,' +
          (height - axisLabelMargin - margin.top - margin.bottom) + ')')
        .call(xAxis)
        .selectAll('text')
          .style('text-anchor', 'end')
          .attr('dx', '-1.4em')
          .attr('dy', '0.8em')
          .attr('transform', 'rotate(-60)');

      //Add x axis label
      g.append('g')
        .append('text')
        .attr('class', 'axis-label')
        .attr('y', height - 35)
        .attr('x', (width - margin.left-120)/2)
        .text(xAxisLabel);
    }

    function addYAxisLabel() {

      g.append('g')
        .attr('class', 'yaxis ')
        .attr('transform', 'translate('+axisLabelMargin+', 0)')
        .call(yAxis)
        .selectAll('text')
          .attr('dy', '0.5em');

      g.append('g')
        .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 65)
        .attr('x', -(height - margin.top + margin.bottom - axisLabelMargin - 190) / 2)
        .style('text-anchor', 'left')
        .text(yAxisLabel);
    }

    function addRectangle() {
      g.append('rect')
        .style('stroke', 'black')
        .style('stroke-width', '5')
        .style('fill', 'white')
        .attr('class', 'background')
        .attr('x', axisLabelMargin)
        .attr('y', -axisLabelMargin)
        .attr('width', width - axisLabelMargin - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .on('click', function() { //Deselects a document when clicking on white space in graph
          if (!chart.getEditing() && !chart.getViewing() && !chart.getDeleting()) {
            chart.setCurrentURI(null);
            if (getLastDoc()) {
              $(getLastDoc()).attr('stroke', 'grey');
              $(getLastDoc()).attr('stroke-width', '1');
              $(getLastDoc()).attr('fill-opacity', 1);
            }
            setLastDoc(null);
          }
        });
    }

    function setLastDoc(ld) {
      lastDoc = ld;
    }

    function getLastDoc() {
      return lastDoc;
    }

    function addBarChartData() {

      var split = g.selectAll('.split');

      split = g.selectAll('.split')
        .data(data)
        .enter()
        .append('g')
        .attr('class','split')
        .attr('stroke', 'black');

      var r;
      var propTooltip = d3.select('body')
        .append('div')
        .style('z-index', '10')
        .style('visibility', 'hidden')
        .style('word-wrap', 'break-word')
        .style('font-weight', 'bold')
        .style('font-size', '18px')
        .style('width', '32em')
        .text('');

      //factor out some code appearing multiple times
      function setDefaultDispPropBehavior(d) {
        if (!displayProperty || displayProperty === 'data') {
          displayProperty = 'data';
          if(!d.content[displayProperty]) {
            displayProperty = validStart;
          }
        }
      }

      r = split
        .append('rect')
        .style('cursor', 'pointer')
        .on('mouseover', function(d) {
          d3.select(this).attr('fill-opacity', 0.7);
          var str = '';

          setDefaultDispPropBehavior(d);
          if (displayProperty.indexOf('.') === -1) {
            str = d.content[displayProperty];
            if(str instanceof Array) {
              str = '[' + str.toString() + ']';
            }
          }
          else {
            str = path(d, 'content.' + displayProperty);
          }
          if(str && str.length > 15) {
            propTooltip.text(str);
          }
          return propTooltip.style('visibility', 'visible');
        })
        .on('mouseout', function(d) {
          var opac = 1;
          propTooltip.text('');
          if (d.uri === uri) { //Keep selected document with different opacity, if moused-over
            opac = 0.4;
          }
          d3.select(this).attr('fill-opacity', opac);
          return propTooltip.style('visibility', 'hidden');
        })
        .on('mousemove', function() {
          var coordinates = [0, 0];
          coordinates = d3.mouse(this);
          propTooltip.style('position', 'absolute')
            .style('top', coordinates[1] + 115 + 'px')
            .style('left', coordinates[0] + 110 + 'px')
            .style('pointer-events', 'none');
        })
        .on('click', function(datum, index) {
          if (!chart.getEditing() && !chart.getDeleting()) {
            chart.setCurrentURI(datum.uri);
            $(this).attr('stroke-width', '4');
            $(this).attr('stroke', 'black');
            $(this).attr('fill-opacity', 0.4);
            $(lastDoc).attr('stroke', 'grey');
            $(lastDoc).attr('stroke-width', '1');
            $(lastDoc).attr('fill-opacity', 1);
            if (lastDoc === this) {
              chart.setCurrentURI(null);
              setLastDoc(null);
              if (isViewing){
                cancel(chart);
              }
            }
            else {
              chart.setCurrentURI(datum.uri);
              setLastDoc(this);
            }
            if (chart.getViewing()) {
              fillText(datum.content, false, 'contents');
            }
          }
        })
        .attr('stroke', 'grey')
        .attr('stroke-width', '1')
        .attr('fill', function(d) {
          setDefaultDispPropBehavior(d);
          if (displayProperty && displayProperty.indexOf('.') === -1) {
            return color(d.content[displayProperty]);
          }
          else {
            var str = path(d, 'content.' + displayProperty);
            return color(str);
          }
        })
        .attr('x', function(d) {
          var barx = xScale(moment(d.content[systemStart]).toDate());
          return barx;
        })
        .attr('y', function(d) {
          var bary = yScale(moment(d.content[validEnd]).toDate());
          return bary;
        })
        .style('opacity', 0)
        .transition()
        .duration(1500)
        .style('opacity', 0.9)
        .attr('height', function(d) {
          var bValStart = yScale(moment(d.content[validStart]).toDate());
          var bValEnd = yScale(moment(d.content[validEnd]).toDate());
          var h=-bValEnd+bValStart;

          return h;
        })
        .attr('width', function(d) {
          var bSysStart = xScale(moment(d.content[systemStart]).toDate());
          var bSysEnd = xScale(moment(d.content[systemEnd]).toDate());
          if (bSysEnd>width) {
            bSysEnd=width-axisLabelMargin;
          }
          var w=bSysEnd-bSysStart;
          return w;
        });

      split.append('text')
        .attr('id', 'box')
        .style('fill', 'DarkMagenta')
        .attr('class','tooltip-txt')
        .style('opacity', 0)
        .transition()
        .duration(1500)
        .style('opacity', 1)
        .style('text-anchor', 'middle')
        .attr('x', function(d) {
          var barx1 = xScale(moment(d.content[systemStart]).toDate());
          var barx2;
          if (!d.content[systemEnd]) {
            return 75;
          }
          if (d.content[systemEnd].indexOf('9999') === 0) {
            barx2 = xScale(moment(d.content[systemStart]).add(5, 'y').toDate());
            return (barx1+barx2)/2;
          }
          else {
            barx2 = xScale(moment(d.content[systemEnd]).toDate());
            return (barx1+barx2)/2;
          }
        })
        .attr('y', function(d) {
          if (!d.content[validEnd]) {
            return 0;
          }
          var bary1 = yScale(moment(d.content[validStart]).toDate());
          var bary2;
          if (d.content[validEnd].indexOf('9999') === 0) {
            bary2 = yScale(moment(d.content[validStart]).add(5, 'y').toDate());
            return (bary1+bary2)/2;
          }
          else {
            bary2 = yScale(moment(d.content[validEnd]).toDate());
            return (bary1+bary2)/2;
          }
        })
        .text(function(d) {
          var str = '';
          if(window.location.href.endsWith('/search')) { 
            str = d.content.uri;
          }
          else {
            setDefaultDispPropBehavior(d);
            if (displayProperty.indexOf('.') === -1) {
              str = d.content[displayProperty];
            }
            else {
              str = path(d, 'content.' + displayProperty);
            }
          }
          var alreadyInGraph = false;
          for(var i = 0; i < displayedProps.length; i++) {
            if(displayedProps[i] === str) {
              alreadyInGraph = true;
            }
          }
          if(alreadyInGraph === false) {
            displayedProps.push(str);
            if(str && str.length > 15) {
              str = str.substring(0, 15) + '...';
            }
            return str;
          }
        });
    }

    function path(object, fullPath) {
      var selection = object;
      fullPath.split('.').forEach(function(path) {
        selection = selection[path];
      });
      return selection;
    }

    function addBackground() {
      background = g.append('svg')
        .attr('class', 'background1')
        .style('stroke', 'red')
        .style('stroke-width', '5')
        .style('fill', 'white')
        .attr('class', 'background')
        .attr('x', axisLabelMargin)
        .attr('y', -axisLabelMargin)
        .attr('width', width - axisLabelMargin - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom);

    }

    function addDragBars() {
      var format = d3.time.format('%Y-%m-%d');

      function lineCreator(x1, x2, y1, y2, direction, id) {
        background
          .append('line')
          .attr('x1', x1)
          .attr('x2', x2)
          .attr('y1', y1)
          .attr('y2', y2)
          .style('opacity', '.99')
          .style('position', 'relative')
          .style('cursor', 'pointer')
          .style('z-index', '1')
          .attr('stroke-width', '8')
          .attr('stroke', 'Blue')
          .data([ {'x':0, 'y':0} ])
          .attr('class', 'hide')
          .attr('id', id)
          .call(direction);
      }

      var dragLeft = d3.behavior.drag()
        .on('dragend', function(d,i) {
          $('#endSysBox').css({'border': '1px solid black'});
          $('#vertBar2').css({'font-weight': 'normal'});
          $('#endSysBox').css({'font-size': '1em'});
          createFilledRectangle();
        })
        .on('drag', function(d,i) {
          if ($('#dragLeft').css( 'stroke' ) === 'rgb(0, 0, 128)') {
            dragLeft.on('drag', null);
          }
          $('#endSysBox').css({'border': '2px solid Blue'});
          $('#endSysBox').css({'font-size': '1.2em'});
          $('#vertBar2').css({'font-weight': 'bold'});
          var scale = xScale.invert( d.x + width - margin.left - margin.right );
          $('#endSysBox').val(format(scale));
          if (d.x + d3.event.dx >= 0) {
            d.x = 0;
          }
          else if(d.x + d3.event.dx <= -1*(width - margin.left - margin.right)){
            d.x = -(width - margin.left - margin.right);
          }
          else {
            d.x += d3.event.dx;
          }
          writeQuery();
          d3.select(this).attr('transform', function(d,i){
            return 'translate(' + [ d.x,d.y ] + ')';
        });
      });

      var dragRight = d3.behavior.drag()
        .on('dragend', function(d,i) {
          $('#startSysBox').css({'border': '1px solid black'});
          $('#vertBar1').css({'font-weight': 'normal'});
          $('#startSysBox').css({'font-size': '1em'});
          createFilledRectangle();
        })
        .on('drag', function(d,i) {
          if ($('#dragRight').css( "stroke" ) === 'rgb(0, 0, 128)') {
            dragRight.on('drag', null);
          }
          $('#startSysBox').css({'border': '2px solid Blue'});
          $('#vertBar1').css({'font-weight': 'bold'});
          $('#startSysBox').css({'font-size': '1.2em'});
          var scale = xScale.invert( d.x );
          $('#startSysBox').val(format(scale));
          if (d.x+d3.event.dx <= 0) {
            d.x = 0;
          }
          else if(d.x + d3.event.dx >= width - margin.left - margin.right){
            d.x = width - margin.left - margin.right;
          }
          else {
            d.x += d3.event.dx;
          }
          writeQuery();
          d3.select(this).attr('transform', function(d,i){
            return 'translate(' + [ d.x,d.y ] + ')';
          });
      });

      var dragUp = d3.behavior.drag()
        .on('dragend', function(d,i) {
          $('#startValBox').css({'border': '1px solid black'});
          $('#horzBar1').css({'font-weight': 'normal'});
          $('#startValBox').css({'font-size': '1em'});
          createFilledRectangle();
        })
        .on('drag', function(d,i) {
          if ($('#dragUp').css( "stroke" ) === 'rgb(0, 0, 128)') {
            dragUp.on('drag', null);
          }
          $('#startValBox').css({'border': '2px solid Blue'});
          $('#horzBar1').css({'font-weight': 'bold'});
          $('#startValBox').css({'font-size': '1.2em'});
          var scale = yScale.invert( d.y + height-margin.top-margin.bottom);
          $('#startValBox').val(format(scale));
          if (d.y+d3.event.dy >= 0) {
              d.y = 0;
          }
          else if(d.y + d3.event.dy <= -1*(height-margin.top-margin.bottom -5)){
            d.y = -1*(height-margin.top-margin.bottom -5);
          }
          else {
            d.y+=d3.event.dy;
          }
          writeQuery();
          d3.select(this).attr('transform', function(d,i){
            return 'translate(' + [ d.x,d.y ] + ')';
          });

      });

      var dragDown = d3.behavior.drag()
        .on('dragend', function(d,i) {
          $('#endValBox').css({'border': '1px solid black'});
          $('#horzBar2').css({'font-weight': 'normal'});
          $('#endValBox').css({'font-size': '1em'});
          createFilledRectangle();
        })
        .on('drag', function(d,i) {
          if ($('#dragDown').css( "stroke" ) === 'rgb(0, 0, 128)') {
            dragDown.on('drag', null);
          }
          $('#endValBox').css({'border': '2px solid Blue'});
          $('#horzBar2').css({'font-weight': 'bold'});
          $('#endValBox').css({'font-size': '1.2em'});
          var scale = yScale.invert(d.y);
          $('#endValBox').val(format(scale));
          if (d.y + d3.event.dy <= 0) {
            d.y = 0;
          }
          else if(d.y+d3.event.dy >= (height-margin.top-margin.bottom)) {
            d.y = height-margin.top-margin.bottom;
          }
          else {
            d.y += d3.event.dy;
          }
          writeQuery();
          d3.select(this).attr('transform', function(d,i){
            return 'translate(' + [d.x, d.y] + ')';
        });
      });

      function lineShifter(textId, barId)  {
        $('#'+textId).change(function() {
          var input = $('#'+textId).val();
          var inputArray = input.split('-');
          if (inputArray.length === 3 && inputArray[0].length === 4 && inputArray[1].length === 2 && inputArray[2].length === 2) {
            var date = new Date(input).toISOString();
            if (textId.includes('Sys')) {
              var dx = xScale(moment(date).toDate());
              if (textId.includes('end')) {
                dx = -(width - margin.left - dx);
              }
              $('#'+barId)[0].__data__.x = dx;
              $('#'+barId).attr('transform', 'translate('+dx+', 0)');
            }
            else {
              var dy = yScale(moment(date).toDate());
              if (textId.includes('start')) {
                dy = -(height-margin.top-margin.bottom-dy);
              }
              $('#'+barId).attr('transform', 'translate(0,'+dy+')');
            }
            writeQuery();
            createFilledRectangle();
          }
          else {
            window.alert('Please enter a valid date. \n [Example: 2015-08-14]');
          }
        });
      }

      lineShifter('startSysBox', 'dragRight');
      lineShifter('endSysBox', 'dragLeft');
      lineShifter('startValBox', 'dragUp');
      lineShifter('endValBox', 'dragDown');

      //right vertical line
      lineCreator(width - margin.left-4, width - margin.left-4, 1, height-margin.top-margin.bottom, dragLeft, 'dragLeft');
      $('#endSysBox').val(format(xScale.invert(width - margin.left - margin.right)));

      //left vertical line
      lineCreator(3, 3, 0, height-margin.top-margin.bottom, dragRight, 'dragRight');
      $('#startSysBox').val(format(xScale.invert(0)));

      //bottom horizontal line
      lineCreator(0, width - margin.left, height - margin.bottom -margin.top-3, height - margin.bottom - margin.top-3 , dragUp, 'dragUp');
      $('#startValBox').val(format(yScale.invert(height -margin.top- margin.bottom)));

      //top horizontal line
      lineCreator(0, width - margin.left, 3, 3, dragDown, 'dragDown');
      $('#endValBox').val(format(yScale.invert(0)));
      
      createFilledRectangle();

      function createFilledRectangle() {
        $('#filledRect').remove();
        //these variables define the area of a rectangle
        x1 = $('#dragLeft')[0].__data__.x;
        x2 = $('#dragRight')[0].__data__.x;
        y1 = $('#dragUp')[0].__data__.y;
        y2 = $('#dragDown')[0].__data__.y;

        var x, y, widthRect, heightRect;
        if(getSelected('valDropdown') !== 'None' && getSelected('sysDropdown') !== 'None') {
          x = x2+7;
          y = y2 + 7;
          widthRect = width - margin.left + x1 - x2 - 14;
          heightRect = height-margin.top-margin.bottom + y1 - y2 - 14;
        }

        else if(getSelected('valDropdown') !== 'None') {
          //only have val times
          x = 0;
          y = y2 + 7;
          widthRect = width - margin.left;
          heightRect = height-margin.top-margin.bottom + y1 - y2 - 14;
        }
        else if(getSelected('sysDropdown') !== 'None') {
          //only have sys times
          x = x2 + 7;
          y = 0;
          widthRect = width - margin.left + x1 - x2 - 14;
          heightRect = height-margin.top-margin.bottom;
        }

        else {
          x=0;
          y=0;
          widthRect = width - margin.left;
          heightRect = height-margin.top-margin.bottom;
        }

        g.append('rect')
        .style('stroke', 'black')
        .style('fill', '#3399FF')
        .style('opacity', '.6')
        .style('visibility', 'hidden')
        .attr('id', 'filledRect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', widthRect)
        .attr('height',  heightRect);
      }

    }

    function addDisplayDocAndPropData() {
      if (document.getElementById('uriEntered')) {
        $.urlParam = function(name) {
          var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
          if (results === null) {
            return null;
          }
          else {
            return results[1] || 0;
          }
        };

        var uriParameter = $.urlParam('collection');
        if (!uriParameter) {
          uriParameter = 'addr.json';
        }
        if (!displayProperty) {
          displayProperty = 'data';
        }

        if (data.length > 0) {
          document.getElementById('uriEntered').innerHTML = 'You are displaying documents in: ' + uriParameter.bold() + ' with property: ' + displayProperty.bold();
        }
        else {
          document.getElementById('uriEntered').innerHTML = 'No data found in document.'.bold();
        }
      }
    }

    getAxisSetup();
    axisLabelMargin = 0;
    setupXAxis();
    setupYAxis();
    setupBarChartLayout();
    addXAxisLabel();
    addYAxisLabel();
    addRectangle();
    addBackground();
    addBarChartData();
    if (draggableBars) {
      addDragBars();
    }
    addDisplayDocAndPropData();

  };

  d3.selection.prototype.size = function() {
    var n = 0;
    this.each(function() { ++n; });
    return n;
  };

  chart.data = function(value) {
    if (!arguments.length) {
      return data;
    }
    data = value;
    return chart;
  };

  chart.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = value;
    return chart;
  };

  chart.xMin = function(value) {
    if (!arguments.length) {
      return xMin;
    }
    xMin = value;
    return chart;
  };

  chart.xMax = function(value) {
    if (!arguments.length) {
      return xMax;
    }
    xMax = value;
    return chart;
  };

  chart.yMin = function(value) {
    if (!arguments.length) {
      return yMin;
    }
    yMin = value;
    return chart;
  };

  chart.yMax = function(value) {
    if (!arguments.length) {
      return yMax;
    }
    yMax = value;
    return chart;
  };

  chart.draggableBars = function(value) {
    if (!arguments.length) {
      return draggableBars;
    }
    draggableBars = value;
    return chart;
  };

  chart.margin = function(value) {
    if (!arguments.length) {
      return margin;
    }
    margin = value;
    return chart;
  };

  chart.getDeleting = function() {
    return isDeleting;
  };

  chart.setDeleting = function(bool) {
    isDeleting = bool;
  };

  chart.getEditing = function() {
    return isEditing;
  };

  chart.setEditing = function(bool) {
    isEditing = bool;
  };

  chart.getViewing = function() {
    return isViewing;
  };

  chart.setViewing = function(bool) {
    isViewing = bool;
  };

  chart.getCurrentURI = function() {
    return uri;
  };

  chart.setCurrentURI = function(u) {
    uri = u;
    if (uri === null) {
      uri = 'null';
    }
    if (document.getElementById('editButton')) {
      document.getElementById('editButton').disabled = uri === 'null';
      document.getElementById('deleteButton').disabled = uri === 'null';
      document.getElementById('viewButton').disabled = uri === 'null';
      document.getElementById('deleteErrMessage').innerHTML = '';
      document.getElementById('selectedURI').innerHTML = 'Selected URI: ' + uri.bold();
    }
  };

  chart.xAxisLabel = function(value) {
    if (!arguments.length) {
      return xAxisLabel;
    }
    xAxisLabel = value;
    return chart;
  };

  chart.yAxisLabel = function(value) {
    if (!arguments.length) {
      return yAxisLabel;
    }
    yAxisLabel = value;
    return chart;
  };

  chart.getDisplayProperty = function() {
    return displayProperty;
  };

  chart.getLogicalURI = function() {
    if (!uri) {
      return 'NoLogicalUriSpecified';
    }
    var logicURI = uri;
    var lastPeriodLoc = uri.lastIndexOf('.');
    var firstPeriodLoc = uri.indexOf('.');
    if (lastPeriodLoc !== firstPeriodLoc) { //More than one '.', indicates a big number within uri.
      logicURI = uri.substring(0, firstPeriodLoc) + uri.substring(lastPeriodLoc, uri.length); // Remove the big number.
    }
    return logicURI;
  };

  chart.setDisplayProperty = function(str) {
    if (!str) {
      displayProperty = 'data';
    }
    else {
      displayProperty = str;
    }
    return chart;
  };

  chart.getSystemStart = function() {
    return systemStart;
  };
  chart.getSystemEnd = function() {
    return systemEnd;
  };
  chart.getValidStart = function() {
    return validStart;
  };
  chart.getValidEnd = function() {
    return validEnd;
  };

  //for creating a document in helper
  chart.getAxisSetup = function(collection, format) {
    $.ajax({
      url: '/v1/resources/axisSetup?rs:collection=' + collection,
      async: false,
      success: function(response, textStatus) {
        if(format === 'JSON') {
          initNewJSON(response);
        }
        else {
          initNewXML(response);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.log('problem: ' + errorThrown);
      }
    });
  }

  return chart;
};
