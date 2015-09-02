/* global loadData, d3, barChart, ajaxTimesCall, moment */

function generateOps() {
  var operators = ['None', 'ALN_EQUALS', 'ALN_CONTAINS', 'ALN_CONTAINED_BY', 'ALN_MEETS', 'ALN_MET_BY', 'ALN_BEFORE', 'ALN_AFTER', 'ALN_STARTS', 'ALN_STARTED_BY', 'ALN_FINISHES', 'ALN_FINISHED_BY', 'ALN_OVERLAPS', 'ALN_OVERLAPPED_BY', 'ISO_OVERLAPS', 'ISO CONTAINS', 'ISO_PRECEDES', 'ISO_SUCCEEDS', 'ISO_IMM_PRECEDES', 'ISO_IMM_SUCCEEDS', 'ISO_EQUALS'];
  for( var i = 0; i < operators.length; i++ ) {
    $('#valDropdown').append($('<option>').text(operators[i]));
    $('#sysDropdown').append($('<option>').text(operators[i]));
  }
}

var addTempColls = function(id, search) {
  $.ajax(
  {
    url: '/manage/v2/databases/Documents/temporal/collections?format=json',
    success: function(response, textStatus)
    {
      if (search) {
        generateOps();
        $('#' + id).append($('<option>').text('--Select--'));
      }
      else {
        $('#' + id).empty();
        $('#' + id).append($('<option>').text('Choose a temporal collection'));
      }
      //adds names of the collections to the drop down list
      var addToDrop = $('#' + id);
      //endpoint is the number of collections
      var endpoint = parseInt(response['temporal-collection-default-list']['list-items']['list-count'].value);

      //dropArray is the array containing all the temporal Collections
      var dropArray = [];
      for (var j = 0; j < endpoint; j++)
      {
        dropArray[j] = response['temporal-collection-default-list']['list-items']['list-item'][j].nameref;
      }
      //sorts alphabetically
      dropArray.sort();

      //Append the u names to the drop down list
      for (var k = 0; k < dropArray.length; k++) {
        addToDrop.append($('<option>').text(dropArray[k]));
        if( k === 0 && search) {
          ajaxTimesCall(dropArray[k], null, false);
        }
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log(jqXHR);
    }
  });
};

var drawChart = function(params, docProp) {
  var chart;
  if( params.timeRanges ) {
    chart = barChart()
      .data(params.data)
      .width(params.width)
      .height(params.height)
      .xMin(params.timeRanges.sysStart)
      .xMax(params.timeRanges.sysEnd)
      .yMin(params.timeRanges.valStart)
      .yMax(params.timeRanges.valEnd)
      .draggableBars(params.draggableBars)
      .setDisplayProperty(docProp);
  }
  else {
    chart = barChart()
      .data(params.data)
      .width(params.width)
      .height(params.height)
      .setDisplayProperty(docProp);
  }

  var selector = '#' + params.containerId;
  d3.select(selector + ' .chart').remove();
  d3.select(selector).append('div').classed('chart', true).call(chart);

  return chart;
};

function clearTextArea() {
  document.getElementById('contents').value = '';
  document.getElementById('sysStartBox').value = '';
  document.getElementById('sysEndBox').value = '';
  if(window.location.href.endsWith('/search')) {
    document.getElementById('newDocContents').value = '';
  }
}

function fillText(data, isEditing, id, chart) {
  clearTextArea();
  //https://gist.github.com/sente/1083506
  //to format pretty printing of xml
  function formatXml(xml) {
    var formatted = '';
    var reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    var pad = 0;
    $.each(xml.split('\r\n'), function(index, node) {
      var indent = 0;
      if (node.match( /.+<\/\w[^>]*>$/ )) {
        indent = 0;
      } else if (node.match( /^<\/\w/ )) {
        if (pad !== 0) {
          --pad;
        }
      } else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) {
        indent = 1;
      } else {
        indent = 0;
      }
      var padding = '';
      for (var i = 0; i < pad; i++) {
        padding += '  ';
      }
      formatted += padding + node + '\r\n';
      pad += indent;
    });

    return formatted;
  }

  var textArea = document.getElementById(id);

  if (data.contentType && data.contentType.indexOf('xml') > -1) {
    var xmlStr = data.childNodes[0].outerHTML;
    textArea.value = formatXml(xmlStr);
  }

  else {//view json doc
    if (isEditing) {
      data[chart.getSystemStart()] = null;
      data[chart.getSystemEnd()] = null;
    }
    textArea.value = JSON.stringify(data, null, 2);
  }
  textArea.readOnly = !isEditing;
}

function cancel(chart) {
  clearTextArea();
  $('#editButton').show();
  $('#viewButton').show();
  $('#deleteButton').show();
  $('#cancelButton').hide();
  $('#contents').hide();
  $('#saveButton').hide();
  chart.setEditing(false);
  chart.setViewing(false);
  chart.setDeleting(false);
  $('#sysTimeDiv').addClass('hideSysTimeBoxes');
  $('#sysEndDiv').addClass('hideSysTimeBoxes');
  $('#deleteButtonsDiv').addClass('hideSysTimeBoxes');
  $('#sysTimeDiv').css({'visibility': 'hidden'});
}

function initButtons() {
  document.getElementById('editButton').disabled = true;
  document.getElementById('deleteButton').disabled = true;
  document.getElementById('viewButton').disabled = true;
  document.getElementById('saveButton').hidden = true;
  document.getElementById('cancelButton').hidden = true;
  document.getElementById('selectedURI').innerHTML = 'Selected URI: ' + 'null'.bold();
}


function initGraph(chart) {
  cancel(chart);
  initButtons();
  $('#sysTimeDiv').addClass('hideSysTimeBoxes');
}

function save(chart) {
  var data = document.getElementById('contents').value;

  var logURI = chart.getLogicalURI();
  var tempColl = chart.getTempColl();
  var url = '/v1/documents?uri='+logURI+'&temporal-collection='+tempColl;

  if (document.getElementById('sysStartBox').value !== '') {
    var date = new Date(document.getElementById('sysStartBox').value).toISOString();
    if (date !== 'Invalid Date') {
      url += '&system-time=' + date;
    }
  }

  var success = function() {
    loadData(logURI);
    initGraph(chart);
  };

  var fail = function(response) {
    if (response.responseJSON.errorResponse.messageCode === 'TEMPORAL-SYSTEMTIME-BACKWARDS') {
      window.alert('Temporal time cannot go backwards, please use a future time');
    }
  };

  $.ajax({
    type: 'PUT',
    contentType: 'application/json',
    processData: false,
    url: url,
    data: data,
    success: success,
    error: fail
  });

}

function saveNewDoc(chart) {
  var data = document.getElementById('newDocContents').value;

  var dropDownList = document.getElementById('selectTempColl');
  var selectedColl = dropDownList.options[dropDownList.selectedIndex].value;
  var newURI = document.getElementById('newUri').value;

  var formatList = document.getElementById('docFormat');
  var format = formatList.options[formatList.selectedIndex].value;

  chart.getAxisSetup(selectedColl, format, true, newURI);
  var sysStart = chart.getSystemStart();
  var url = '/v1/documents/?uri='+newURI+'&temporal-collection='+selectedColl;

  //Check if lsqt is set
  var date;
  if (format === 'JSON') {
    data = $.parseJSON(data);
    date = data[sysStart];
    data = JSON.stringify(data);
  } else {
    var xmlObj = $.parseXML(data);
    date = xmlObj.getElementsByTagName(sysStart)[0].innerHTML;
  }

  date = new Date(date).toISOString();
  if (date !== 'Invalid Date') {
    url += '&system-time=' + date;
  }
  else {
    window.alert('Invalid date in ' + sysStart);
    return;
  }
  setLsqt(selectedColl, true)
  $.ajax({
    url: url,
    type: 'PUT',
    data: data,
    processData: false,
    success: function(data) {
      window.alert('Document was saved');
    },
    error: function(jqXHR, textStatus) {
      if (jqXHR.responseJSON.errorResponse.messageCode === 'TEMPORAL-NOLSQT') {
        window.alert('No LSQT set for this collection ('+selectedColl+')\n Set it and try again.');
      }
      else {
        window.alert('The creation of your new document did not work.');
      }
      $('#dialogCreateDoc').dialog('close');
    },
    contentType: 'application/' + format.toLowerCase()
  });
}

function setupTextArea(chart, isEditing) {
  $('#editButton').hide();
  $('#viewButton').hide();
  $('#deleteButton').hide();
  $('#cancelButton').show();
  $('#contents').show();

  if (isEditing) {
    $('#saveButton').show();
  }
  var successFunc = function(data) {
    var bool = chart.getLsqt();
    if(isEditing && bool === 'false') {
      $('#sysTimeDiv').addClass('hideSysTimeBoxes');
    }
    fillText(data, isEditing, 'contents', chart);
  };
  $.ajax({
    url: '/v1/documents/?uri=' + chart.getCurrentURI(),
    success: successFunc,
    format: 'json'
  });

}

function view(chart) {
  if (chart.getCurrentURI()) {
    setupTextArea(chart, false); //false so function knows the document is not being edited
    $('#sysTimeDiv').addClass('hideSysTimeBoxes');
  }
  else {
    window.alert('Please click a doc first');
  }
}

function edit(chart) {
  if (chart.getCurrentURI()) {
    setupTextArea(chart, true); //true so function knows the document is being edited
    $('#sysTimeDiv').css({'visibility': 'visible'});
  }
  else {
    window.alert('Please click a doc first');
  }
}

//Gets all temporal collections in database
function getTemporalColl(uri) {
  var docColl = $.ajax({
    url: '/manage/v2/databases/Documents/temporal/collections?format=json',
    uriref: uri,
    success: function(data, textStatus) {
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log('Problem');
    },
    async: false,
  });

  return JSON.parse(docColl.responseText);
}

//Gets all collections the uri belongs to.
function getDocColls(uri) {
  var docColl;
  $.ajax({
    url: '/v1/documents?uri='+uri+'&category=collections&format=json',
    success: function(data, textStatus) {
      docColl = data;
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log('problem');
      docColl = null;
    },
    async: false
  });

  if (docColl && docColl !== undefined) {
    return docColl.collections;
  }
  else {
    return null;
  }
}

function deleteSuccess(response, tempColl, chart) {
  var tempDate = new Date(response[chart.getSystemEnd()]);
  var ajax = true;
  var logURI = chart.getLogicalURI();

  var url = '/v1/documents?uri=' + logURI + '&temporal-collection=' + tempColl;

  //Add a system time to ajax request if specified
  var sysBoxDate = document.getElementById('sysEndBox').value;
  if (sysBoxDate !== '') {
    sysBoxDate = new Date(sysBoxDate);
    url += '&system-time='+sysBoxDate.toISOString();
    if (tempDate.valueOf() > sysBoxDate.valueOf()){
      ajax = false;
    }
  }

  if (ajax === true) {
    $.ajax({
      url: url,
      type: 'DELETE',
      success: function() {
        loadData(logURI);
        $('#editButton').show();
        $('#viewButton').show();
        $('#deleteButton').show();
      },
      error: function(jqXHR, textStatus) {
        cancel(chart);
        window.alert('Delete didn\'t work, most likely an error in the date? Sample date: 2015-09-31T00:00:00Z\n\n Or perhaps LSQT is not set for this collection');
      },
    });
  }
  else {
    cancel(chart);
    document.getElementById('deleteErrMessage').innerHTML = 'Error: System time does not go backward.'.bold() + ' Current time for temporal collection is ' + tempDate;
  }
  clearTextArea();
  $('#deleteButtonsDiv').addClass('hideSysTimeBoxes');
  $('#sysEndDiv').addClass('hideSysTimeBoxes');
}

var deleteDoc = function (chart) {
  var tempColl = chart.getTempColl();

  if (tempColl) {
    $.ajax( //Gets a temporal collection
    {
      url: '/v1/resources/temporal-range?rs:collection='+tempColl,
      success: function(response, textStatus)
      {
        deleteSuccess(response, tempColl, chart);
      },
      error: function(jqXHR, textStatus, errorThrown)
      {
        console.log('problem');
        cancel(chart);
      }
    });
  }
};

function setupDelete(chart) {
  var uri = chart.getCurrentURI();
  document.getElementById('deleteErrMessage').innerHTML = '';

  var date = moment().toISOString();
  date = date.split('.');
  $('#sysEndBox').val(date[0]);
  if (!uri) { // No uri selected
    return;
  }
  $('#editButton').hide();
  $('#viewButton').hide();
  $('#deleteButton').hide();
  $('#sysEndDiv').removeClass('hideSysTimeBoxes');
  $('#deleteButtonsDiv').removeClass('hideSysTimeBoxes');
}

function changeTextInGraph(chart, params) {
  var docProp = $('input[name = documentProperty]').val();
  if (docProp === '') {
    window.alert('Please enter a document property.');
  }
  var propExists = false;

  for(var i = 0; i < params.data.length && !propExists; i++) {
    for(var prop in params.data[i].content) {
      if (params.data[i].content.hasOwnProperty(prop)) {
        if(prop === docProp || docProp.substring(0, docProp.indexOf('.')) === prop) {
          propExists = true;
        }
      }
    }
  }
  if(propExists) {
    drawChart(params, docProp);
  }
  else if (docProp !== '') {
    window.alert('Sorry. That property does not exist in any document in the collection');
  }
}

/*
 * @param obj
 * @param path
 * @param properties -- modified as new properties are found
 */
function findProperties(obj, path, properties) {
  var newPath;
  if (typeof obj === 'object') {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        newPath = path ? path + '.' + prop : prop;
        if (Array.isArray(obj[prop])) {
          properties[newPath] = true;
        } else if (typeof obj[prop] === 'object') {
          findProperties(obj[prop], newPath, properties);
        } else {
          properties[newPath] = true;
        }
      }
    }
  }
}

function addDataToMenu(chart, params) {
  if(!params.timeRanges) {
    $('#select-prop').empty();
    var propsInGraph = {};
    var docProp = chart.getDisplayProperty();
    if (params.data.length > 0) {
      propsInGraph[docProp] = true;
    }

    for(var i = 0; i < params.data.length; i++) {
      findProperties(params.data[i].content, null, propsInGraph);
    }
    var select = document.getElementById('select-prop');
    if(select) {
      for(var property in propsInGraph) {
        $('#select-prop').append($('<option>').text(property));
      }
    }
  }
}

var removeButtonEvents = function () {
  //Clear these buttons' previous event handlers
  $('#editButton').unbind('click');
  $('#deleteButton').unbind('click');
  $('#cancelButton').unbind('click');
  $('#viewButton').unbind('click');
  $('#saveButton').unbind('click');
  $('#change-prop').unbind('click');
  $('#select-prop').unbind('change');
  $('#deleteOKButton').unbind('click');
  $('#pick-doc').unbind('click');
};

function initLsqt(chart) {
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

  if (document.getElementById('collection') && uriParameter === null) {
    document.getElementById('collection').innerHTML = 'The temporal collection is not specified.'.bold();
    return;
  }
  if(chart.data().length === 0) {
    //empty collection
    return;
  }

  //gets temporal collection
  var tempCollections = getTemporalColl(uriParameter);
  var tempCollArr = tempCollections['temporal-collection-default-list']['list-items']['list-item'];
  var collArr = getDocColls(uriParameter);
  var tempColl;

  for(var i = 0; i < tempCollArr.length && !tempColl; i++) {
    for(var j = 0; j < collArr.length; j++) {
      if(tempCollArr[i].nameref === collArr[j]) {
        tempColl = tempCollArr[i].nameref;
      }
    }
  }

  //gets lsqt for the collection and sets label on home page.
  $.ajax({
    url: 'http://localhost:3000/manage/v2/databases/Documents/temporal/collections/lsqt/properties?collection=' + tempColl + '&format=json',
    async: false,
    type: 'GET',
    success: function(response, textStatus) {
      document.getElementById('collection').innerHTML = 'Temporal Collection: ' + tempColl.bold();
      chart.setTempColl(tempColl);
      chart.setLsqt(response['lsqt-enabled'].toString());
      document.getElementById('myonoffswitch').checked = response['lsqt-enabled'];
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log('problem: ' + errorThrown);
    }
  });
}

var getBarChart = function (params, docProp) {
  if (document.getElementById('editButton')) {
    removeButtonEvents();
    initButtons();
  }
  var chart = drawChart(params, docProp);
  if (params.collection) {
    window.history.pushState('', 'Title', '/view?collection='+params.collection);
  }

  if (params) {
    addDataToMenu(chart, params);
    initLsqt(chart);
  }

  $('#editButton').click(function() {
    document.getElementById('deleteErrMessage').innerHTML = '';
    edit(chart);
    chart.setEditing(true);
  });

  $('#deleteButton').click(function() {
    setupDelete(chart);
    chart.setDeleting(true);
  });

  $('#cancelButton').click(function() {
    cancel(chart);
  });

  $('#viewButton').click(function() {
    document.getElementById('deleteErrMessage').innerHTML = '';
    view(chart);
    chart.setViewing(true);
  });

  $('#saveButton').click(function() {
    save(chart);
  });

  $('#change-prop').click(function() {
    changeTextInGraph(chart, params);
  });

  addTempColls('selectTempColl', false);
  $('#createDoc').click(function() {
    $('#createDocStuff').show();
    $('#dialogCreateDoc').dialog({
      autoOpen: true,
      modal: true,
      appendTo: false,
      width: 550,
      height: 500,
      buttons: {
        Save: function() {
          saveNewDoc(chart);
          $(this).dialog('close');
          $('#selectTempColl').val('Choose a temporal collection');
          $('#newUri').val('');
          $('#newDocContents').val('');
        },
        Cancel: function() {
          $(this).dialog('close');
          $('#selectTempColl').val('Choose a temporal collection');
          $('#newUri').val('');
          $('#newDocContents').val('');
        }
      },
    });
  });

  $('#deleteOKButton').click(function() {
    deleteDoc(chart);
  });

  $('#deleteCancelButton').click(function() {
    cancel(chart);
  });

  $('#select-prop').change(function() {
    var selectedText = $(this).find('option:selected').text();
    $('#selectTempColl').empty();
    $('#selectTempColl').append($('<option>').text('Choose a temporal collection'));
    getBarChart(params, selectedText);
  });

  $('#myonoffswitch').change( function() {
    var lsqtBool = document.getElementById('myonoffswitch').checked;
    if(chart.getEditing() && lsqtBool === true) {
      $('#sysTimeDiv').css({'visibility': 'visible'});
    }
    if (chart.getEditing() && lsqtBool === false ) {
      $('#sysTimeDiv').css({'visibility': 'hidden'});
    }
    setLsqt(chart.getTempColl(), lsqtBool);
    chart.setLsqt(lsqtBool.toString());
  });

  function XMLOrJSONTextForCollection() {
    var formatOption = $('#docFormat').find('option:selected').text();
    var tempColl = $('#selectTempColl').find('option:selected').text();
    if(tempColl !== 'Choose a temporal collection') {
      chart.getAxisSetup(tempColl, formatOption);
    }
  }

  $('#selectTempColl').change(function() {
    new XMLOrJSONTextForCollection();
  });

  $('#docFormat').change(function() {
    new XMLOrJSONTextForCollection();
  });

  $('#pick-doc').click(function () {
    var uriCollection = $('input[name = collection]').val();
    if(uriCollection === '') {
      window.alert('Please enter a uri.');
    }
    else {
      window.history.pushState('', 'Title', '/view?collection='+uriCollection);
      loadData(uriCollection);
      cancel(chart);
    }
  });
};
