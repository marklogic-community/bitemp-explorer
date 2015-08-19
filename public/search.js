/* global parseData */
var firstDoc, lastDoc, uriArr;

function generateOps() {
  var operators = ['None', 'ALN_EQUALS', 'ALN_CONTAINS', 'ALN_CONTAINED_BY', 'ALN_MEETS', 'ALN_MET_BY', 'ALN_BEFORE', 'ALN_AFTER', 'ALN_STARTS', 'ALN_STARTED_BY', 'ALN_FINISHES', 'ALN_FINISHED_BY', 'ALN_OVERLAPS', 'ALN_OVERLAPPED_BY', 'ISO_OVERLAPS', 'ISO CONTAINS', 'ISO_PRECEDES', 'ISO_SUCCEEDS', 'ISO_IMM_PRECEDES', 'ISO_IMM_SUCCEEDS', 'ISO_EQUALS'];
  for( var i = 0; i < operators.length; i++ ) {
    $('#valDropdown').append($('<option>').text(operators[i]));
    $('#sysDropdown').append($('<option>').text(operators[i]));
  }
}

function getSelected(id) {
  var dropDownList = document.getElementById(id);
  return dropDownList.options[dropDownList.selectedIndex].value;
}

$('#valDropdown')
  .change(function() {
    writeQuery();
    $('#filledRect, #dragUp, #dragDown, .valTimesDisplay, #startValBox, #endValBox').css({'visibility': 'hidden'});
    var selectedColl = getSelected('dropdown');
    if (getSelected('sysDropdown') === 'None') {
      $('#resetBarsButton').css({'visibility': 'hidden'});
    }
    if (getSelected('valDropdown') !== 'None') {
      $('#searchQueryButton, #resetBarsButton, #dragUp, #dragDown, .valTimesDisplay, #startValBox, #endValBox').css({'visibility': 'visible'});
    }
  });

$('#sysDropdown').change(function() {
  writeQuery();
  $('#filledRect, #dragRight, #dragLeft, .sysTimesDisplay, #startSysBox, #endSysBox').css({'visibility': 'hidden'});
  var selectedColl = getSelected('dropdown');
  if (getSelected('valDropdown') === 'None') {
    $('#resetBarsButton').css({'visibility': 'hidden'});
  }
  if (getSelected('sysDropdown') !== 'None') {
    $('#searchQueryButton, #resetBarsButton, #dragRight, #dragLeft, .sysTimesDisplay, #startSysBox, #endSysBox').css({'visibility': 'visible'});
  }
});

$('#searchQueryButton').click(function() {
  runSearchQuery();
});

$('#resetBarsButton').click(function() {
  var selectedColl = getSelected('dropdown');
  ajaxTimesCall(selectedColl, null, true);
});

$('#resetButton').click(function() {
  writeQuery();
  var selectedColl = getSelected('dropdown');
  ajaxTimesCall(selectedColl, null, false);
  document.getElementById('valDropdown').disabled = false;
  document.getElementById('sysDropdown').disabled = false;
  document.getElementById('dropdown').disabled = false;
  document.getElementById('queryText').style.fontWeight = "normal";
  document.getElementById('queryText').style.border = "1px black solid";
  document.getElementById('queryText').value = 'No query was run';
  $('#valDropdown, #sysDropdown').val('None');
  $('#queryText').val('');
  document.getElementById('dragInstruct').innerHTML = '*Select an operator and drag the blue bars to create your selected time range*';
  $('#resetButton, .sysTimesDisplay, .valTimesDisplay, #errorMessage, #numDocs, #next, #prev').css({'visibility': 'hidden'});
  $('#searchQueryButton').css({'visibility': 'visible'});
  $('#bulletList').empty();
});

function runSearchQuery() {
  var selectedColl = getSelected('dropdown');
  var valSelectedOp = getSelected('valDropdown');
  var sysSelectedOp = getSelected('sysDropdown');

  var valAxis = '';
  var sysAxis = '';

  var valStart = '';
  var valEnd = '';

  if(valSelectedOp !== 'None') {
    valAxis = 'myValid';
    valStart = document.getElementById('startValBox').value;
    valEnd = document.getElementById('endValBox').value;
    if (valStart >= valEnd) {
      window.alert('Valid start time cannot be greater than or equal to valid end time');
      return;
    }
    valStart = new Date(valStart).toISOString();
    valEnd = new Date(valEnd).toISOString();
  }

  var sysStart = '';
  var sysEnd = '';

  if(sysSelectedOp !== 'None') {
    sysAxis = 'mySystem';
    sysStart = document.getElementById('startSysBox').value;
    sysEnd = document.getElementById('endSysBox').value;
    if (sysStart >= sysEnd) {
      window.alert('System start time cannot be greater than or equal to system end time');
      return;
    }
    sysStart = new Date(sysStart).toISOString();
    sysEnd = new Date(sysEnd).toISOString();
  }

  if(valSelectedOp === 'None' && sysSelectedOp === 'None' ) {
    firstDoc = 1;
    lastDoc = 10;
    $('#searchQueryButton, #filledRect').css({'visibility': 'hidden'});
    document.getElementById('queryText').value = 'No query was run';
    document.getElementById('dragInstruct').innerHTML = '*View all the documents for this collection on the right and click reset to reload the page*'.bold();
    $('#resetButton').css({'visibility': 'visible'});
    document.getElementById('valDropdown').disabled = true;
    document.getElementById('sysDropdown').disabled = true;
    document.getElementById('dropdown').disabled = true;
    displayDocs(firstDoc, lastDoc);  
  }

  else {
    $.ajax({
        url: '/v1/resources/operators?rs:collection='+selectedColl+'&rs:valAxis='+valAxis+'&rs:valSelectedOp='+valSelectedOp+'&rs:sysAxis='+sysAxis+'&rs:sysSelectedOp='+sysSelectedOp+'&rs:valStart='+valStart+'&rs:valEnd='+valEnd+'&rs:sysStart='+sysStart+'&rs:sysEnd='+sysEnd,
        success: function(response, textStatus)
        {
          ajaxTimesCall(response.collection, response, false);
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
          console.log('problem');
        }
    });
  }

}

$('#dropdown').change(function() {
  $('#next, #prev, .hide, #startValBox, #endValBox, #startSysBox, #endSysBox').css({'visibility': 'hidden'});
  var selectedColl = getSelected('dropdown');
  ajaxTimesCall(selectedColl, null, false);
  $('#bulletList, #numDocs').empty();
  document.getElementById('valDropdown').disabled=false;
  document.getElementById('sysDropdown').disabled=false;
  document.getElementById('valDropdown').selectedIndex = 0;
  document.getElementById('sysDropdown').selectedIndex = 0;
});

//function to make ajax call to get min and max times
function ajaxTimesCall(selectedColl, dataToDisplay, visibleBars) {
  $.ajax(
    {
      url: '/v1/resources/temporal-range?rs:collection='+selectedColl,
      success: function(response, textStatus)
      {
        var data = [];
        var drag = true;
        if(dataToDisplay !== null) {
          uriArr = dataToDisplay.uri;
          if (!dataToDisplay.values) {
            $('#errorMessage').css({'visibility': 'visible'});
          }
          drag = false;
        }

        var times = response;
        var timeRanges = {
          valStart: toReturnDate(times.valStart),
          valEnd: toReturnDate(times.valEnd),
          sysStart: toReturnDate(times.sysStart),
          sysEnd: toReturnDate(times.sysEnd)
        };

        if(!drag) {
          document.getElementById('vertBar1').innerHTML = 'Start Time:' + '&nbsp;&nbsp;' + $('#startSysBox').val().bold();
          document.getElementById('vertBar2').innerHTML = 'End Time:' + '&nbsp;&nbsp;' + $('#endSysBox').val().bold();
          document.getElementById('horzBar1').innerHTML = 'Start Time:'+ '&nbsp;&nbsp;' + $('#startValBox').val().bold();
          document.getElementById('horzBar2').innerHTML = 'End Time:' + '&nbsp;&nbsp;' + $('#endValBox').val().bold();
          document.getElementById('dragInstruct').innerHTML = '*View the query below the graph and click reset to reload the page*'.bold();
          $('#startSysBox, #endSysBox, #endValBox, #startValBox, #searchQueryButton, #resetBarsButton').css({'visibility': 'hidden'});
            // document.getElementById('dragInstruct').innerHTML = '*View the query below the graph and click reset to reload the page*'.bold();
          document.getElementById('queryText').style.fontWeight = "bold";
          document.getElementById('queryText').style.border = "3px black solid";
          $('#filledRect').css({'visibility': 'visible'})
          $('#resetButton').css({'visibility': 'visible'});
          document.getElementById('dropdown').disabled=true;
          document.getElementById('valDropdown').disabled=true;
          document.getElementById('sysDropdown').disabled=true;
          if (getSelected('sysDropdown') !== 'None') {
            document.getElementById('dragLeft').style.stroke = '#000080';
            document.getElementById('dragRight').style.stroke = '#000080';
            document.getElementById('dragLeft').draggable = 'disable'
          }
          if (getSelected('valDropdown') !== 'None') {
            document.getElementById('dragUp').style.stroke = '#000080';
            document.getElementById('dragDown').style.stroke = '#000080';
          }
        }

        else {
          getBarChart({
            data: data,
            width: 650,
            height: 450,
            xAxisLabel: 'System',
            yAxisLabel: 'Valid',
            timeRanges: timeRanges,
            draggableBars: drag,
            containerId: 'bar-chart-large'
          }, null);
        }

        if (visibleBars) {
          if (getSelected('sysDropdown') !== 'None') {
            $('#dragLeft').css({'visibility': 'visible'});
            $('#dragRight').css({'visibility': 'visible'});
          }
          if (getSelected('valDropdown') !== 'None') {
            $('#dragUp').css({'visibility': 'visible'});
            $('#dragDown').css({'visibility': 'visible'});
          }
        }

        if (!timeRanges.sysStart) {
          window.alert('There are no documents in this collection. Please select another.');
          document.getElementById('valDropdown').disabled=true;
          document.getElementById('sysDropdown').disabled=true;
        }
        if(dataToDisplay !== null) {
          firstDoc = 1;
          lastDoc = 10;
          displayDocs(firstDoc, lastDoc);        
        }
      },
      error: function(jqXHR, textStatus, errorThrown)
      {
        console.log('problem');
      }
    }
  );
}

function toReturnDate(time) {
  if( time ) {
    return new Date(time);
  }
  else {
    return null;
  }
}

//function when search button is clicked
$('#search').click(function() {
  firstDoc = 1;
  lastDoc = 10;
  displayDocs(firstDoc, lastDoc);
  $('#next, #prev, #numDocs').css({'visibility': 'visible'});
});

//function when the next button is clicked
$('#next').click(function() {
  firstDoc+=10;
  lastDoc+=10;
  displayDocs(firstDoc, lastDoc);
});

//function when the prev button is clicked
$('#prev').click(function() {
  firstDoc-=10;
  lastDoc-=10;
  displayDocs(firstDoc, lastDoc);
});

/**
* Display docs is a function that displays the physical and logcial documents
* corresponding to the collection selected in the dropdown box.
* For each document the System and Valid times are displayed
*
* @param start: the index of the first document you want to display
* @param end: the index of the last document you want to display (will always be 9 greater than start)
*/
function displayDocs(start, end) {
  var bullet = $('#bulletList');
  bullet.empty();
  var selectedColl = getSelected('dropdown');

  //call to get all documents (excluding .lsqt) from the collection selected in the drop down list
  $.ajax(
  {
    url: '/v1/search?structuredQuery={%20%22search%22:{%20%22query%22:{%20%22and-not-query%22:%20{%20%22positive-query%22:%20{%20%22collection-query%22:%20{%20%22uri%22:%20[%20%22'+selectedColl+'%22%20]%20}%20},%20%22negative-query%22:%20{%20%22collection-query%22:%20{%20%22uri%22:%20[%20%22lsqt%22%20]%20}%20}%20}%20},%20%22options%22:{%20%22search-option%22:[%22unfiltered%22]%20}%20}%20}&format=json&pageLength=100&category=content&category=collections&start='+start,
    headers:
    {
      'Accept': 'multipart/mixed'
    },
    success: onDisplayDocs,
    error: function(jqXHR, textStatus, errorThrown)
    {
      console.log('problem');
    }
  });

  function onDisplayDocs(data, textStatus, response) {
    var docs, totalDocLen;
    $('#next, #prev, #numDocs').css({'visibility': 'visible'});
    if (uriArr) {
      totalDocLen = uriArr.length;
    }
    else {
      totalDocLen = response.getResponseHeader('vnd.marklogic.result-estimate');
    }
    if (totalDocLen > 10) {
      docs = parseData(data, null, 2);
      document.getElementById('next').disabled = false;
      document.getElementById('prev').disabled = false;
    }
    else if( totalDocLen > 0 )
    {
      docs = parseData(data, null, 2);
    }
    // Checks and sets boundary points.
    // Looks at the index of the first and last document (passed into the function)
    // and disables or enables the next/previous buttons based on those indexes.
    document.getElementById('prev').disabled = start <= 1;

    if (end >= totalDocLen) {
      document.getElementById('next').disabled = true;
      end = totalDocLen;
    }
    else {
      document.getElementById('next').disabled = false;
    }

    if (parseInt(totalDocLen) === 0) {
      $('#next, #prev, #numDocs').css({'visibility': 'hidden'});
      document.getElementById('numDocs').innerHTML = start - 1 + ' to ' + end + ' of ' + totalDocLen;
    }
    else {
      document.getElementById('numDocs').innerHTML = start + ' to ' + end + ' of ' + totalDocLen;
    }

    //Loops through the documents to get the URI and the valid and system times
    //Calls functions to display the information on the search page
    //Checks if docs has a defined value
    docs = parseData(data, null, 2);
    
    var i = 0;

    while(docs[i] !== undefined) {
      if (uriArr) {
        var uri = docs[i].uri;
        for(var k = 0; k < uriArr.length; k++) {
          if(uriArr[k] === uri) {
            createBulletList(docs[i]);
          }
        }
      }
      else {
        createBulletList(docs[i]);
      }
      i++;
    }
    uriArr = null;
  }
}

function createBulletList(doc) {
  var uri = doc.uri;
  var uriLogical;
  var collArr = doc.collections.collections;
  var selectedColl = getSelected('dropdown');
  for (var t = 0; t < collArr.length; t++) {
    if ( !collArr[t].includes( 'latest' ) && !collArr[t].includes(selectedColl)) {
      uriLogical = collArr[t];
    }
  }

  var sysStart = doc.content.sysStart;
  var sysEnd = doc.content.sysEnd;
  var validStart = doc.content.valStart;
  var validEnd = doc.content.valEnd;

  $('#bulletList')
    .append($('<hr id=\'break\'>')
    )
    .append(
      $('<div>')
        .addClass('result')
        .append(
          $('<em>')
            .attr('id', 'physicalDoc')
            .css('font-size', '1.25em')
            .attr('class', 'definition')
            .attr('title', 'Physical Document: Represent specific visual effects which are intended to be reproduced in a precise manner, and carry no connotation as to their semantic meaning')
            .text(uri)
        )
        .append(
          $('<a>')
            .attr('href', '/?collection='+uriLogical)
            .attr('class', 'definition')
            .css('color', 'MediumBlue')
            .attr('title', 'Logical Document: Represent the structure and meaning of a document, with only suggested renderings for their appearance which may or may not be followed by various browsers under various system configurations')
            .text('('+uriLogical+')')
        )
        .append(buildDate(new Date(validStart), new Date(validEnd), 'Valid Time: '))
        .append(buildDate(new Date(sysStart), new Date(sysEnd), 'System Time: '))
        .append('<br>')
    );
}


/**
* Appends the dates to the bullet list.
*
* @param startDate: the starting date
* @param endate: the end date
* @param label: either 'System Time' or 'Valid Time'
*/
function buildDate( startDate, endDate, label ) {
  var date = $('<div>').addClass('date');
  startDate = shortenDate( startDate );
  endDate = shortenDate( endDate );
  date
    .append(
      $('<b>')
        .text(label)
    )
    .append(
      $('<div>')
        .text(startDate + ' -- ' + endDate)
    );

  return date;
}

/**
 * Shortens the date to only include the day, month, year, and time.
 * The time appears as hours, minutes, seconds, excluding 'GMT'
 *
 * @param date: the date to shorten
 */
function shortenDate( date ) {
  date = date.toString().split(' ');
  if (date[3] >= '9999') {
    return 'Infinity';
  }
  return  date[0]+'. '+date[1]+' '+date[2]+', '+date[3]+' '+date[4];
}

function writeQuery() {
  var valOperator = getSelected('valDropdown');
  var sysOperator = getSelected('sysDropdown');
  var collection = getSelected('dropdown');
  var valAxis = 'myValid';
  var sysAxis = 'mySystem';
  var valStart = document.getElementById('startValBox').value;
  var valEnd = document.getElementById('endValBox').value;
  var sysStart = document.getElementById('startSysBox').value;
  var sysEnd = document.getElementById('endSysBox').value;

  var text;
  if (valOperator !== 'None' && sysOperator !== 'None') {
    text = 'cts.search(\n' + '\tcts.andQuery([\n' + '\t\tcts.collectionQuery("'+collection+'"),\n' + '\t\tcts.periodRangeQuery(\n' + '\t\t\t"' + valAxis +'",\n'+ '\t\t\t"' + valOperator +'",\n'+ '\t\t\t' + 'cts.period(\n' + '\t\t\t\txs.dateTime("'+valStart+'"),\n' + '\t\t\t\txs.dateTime("'+valEnd+'")\n' + '\t\t\t)\n' + '\t\t),\n' + '\t\tcts.periodRangeQuery(\n' + '\t\t\t"' + sysAxis +'",\n'+ '\t\t\t"' + sysOperator +'",\n'+ '\t\t\t' + 'cts.period(\n' + '\t\t\t\txs.dateTime("'+sysStart+'"),\n' + '\t\t\t\txs.dateTime("'+sysEnd+'")\n' + '\t\t\t)\n' + '\t\t)]\n' + '\t)\n' + ')';
  }

  else if (valOperator !== 'None') {
    text = 'cts.search(\n' + '\tcts.andQuery([\n' + '\t\tcts.collectionQuery("'+collection+'"),\n' + '\t\tcts.periodRangeQuery(\n' + '\t\t\t"' + valAxis +'",\n'+ '\t\t\t"' + valOperator +'",\n'+ '\t\t\t' + 'cts.period(\n' + '\t\t\t\txs.dateTime("'+valStart+'"),\n' + '\t\t\t\txs.dateTime("'+valEnd+'")\n' + '\t\t\t)\n' + '\t\t)]\n' +'\t)\n' + ')';
  }

  else if (sysOperator !== 'None') {
    text = 'cts.search(\n' + '\tcts.andQuery([\n' + '\t\tcts.collectionQuery("'+collection+'"),\n' + '\t\tcts.periodRangeQuery(\n' + '\t\t\t"' + sysAxis +'",\n'+ '\t\t\t"' + sysOperator +'",\n'+ '\t\t\t' + 'cts.period(\n' + '\t\t\t\txs.dateTime("'+sysStart+'"),\n' + '\t\t\t\txs.dateTime("'+sysEnd+'")\n' + '\t\t\t)\n' + '\t\t)]\n' +'\t)\n' + ')';
  }
  document.getElementById('queryText').value = text;
}