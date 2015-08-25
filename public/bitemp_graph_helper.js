//call to get the list of temporal collection
/* global loadData, d3, barChart, generateOps, ajaxTimesCall */

function toReturnDate(time) {
  if (time) {
    return new Date(time);
  }
  else {
    return null;
  }
}

var getDocColl = function(uri) {
  $.ajax({
    url: '/v1/documents?uri='+uri+'&category=collections&format=json',
    success: function(data, textStatus) {
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log('problem');
    },
    async: false,
  });
};

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
      var addToDrop = $('#'+id);
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

      //Append the collection names to the drop down list
      for (var k = 0; k < dropArray.length; k++) {
        addToDrop.append($('<option>').text(dropArray[k]));
        if( k === 0 && search) {
          ajaxTimesCall(dropArray[k], null, false);
        }
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      console.log('problem');
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
  var currDate = new Date();
  document.getElementById('contents').value = '';
  document.getElementById('sysStartBox').value = '';
  document.getElementById('newDocContents').value = '';
}

function fillText(data, isEditing, id, chart) {
  clearTextArea();

  var textArea = document.getElementById(id);

  if(data.contentType && data.contentType.indexOf('xml') > -1) {
    var xmlStr = data.childNodes[0].outerHTML;
    //https://gist.github.com/sente/1083506
    //to format pretty printing of xml
    function formatXml(xml) {
      var formatted = '';
      var reg = /(>)(<)(\/*)/g;
      xml = xml.replace(reg, '$1\r\n$2$3');
      var pad = 0;
      jQuery.each(xml.split('\r\n'), function(index, node) {
        var indent = 0;
        if (node.match( /.+<\/\w[^>]*>$/ )) {
          indent = 0;
        } else if (node.match( /^<\/\w/ )) {
          if (pad != 0) {
            pad -= 1;
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
    textArea.value = formatXml(xmlStr);
  }

  else {//view json doc
    if (isEditing) {
      data[chart.getSystemStart()] = null;
      data[chart.getSystemEnd()] = null;
    }
    textArea.value = JSON.stringify(data, null, 2);
    textArea.readOnly = !isEditing;
  }
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
  $('#deleteButtonsDiv').addClass('hideSysTimeBoxes');
}

function save(chart) {
  var data = document.getElementById('contents').value.replace(/\n/g, '');
  data = jQuery.parseJSON(data);

  var uri = chart.getCurrentURI();
  var logURI = chart.getLogicalURI();
  
  var collArr = getDocColls(uri);
  var tempCollections = getTemporalColl(uri);
  var tempCollArr = tempCollections['temporal-collection-default-list']['list-items']['list-item'];

  var tempColl;
  if (collArr && tempCollArr) {
    collArr = collArr.collections;
    tempColl = findCommonColl(collArr, tempCollArr);
  }

  if (document.getElementById('sysStartBox').value) {
    data[chart.getSystemStart()] = document.getElementById('sysStartBox').value;
  }

  var success = function() {
    cancel(chart);
  };
  var fail = function(data) {
    window.alert('PUT didn\'t work: ' + data);
  };
  var contType;
  if (uri.endsWith('.json')) {
    contType = 'application/json';
    data = JSON.stringify(data);
  } else {
    contType = 'application/xml';
    //data = jQuery.stringify
  }
  
  $.ajax({
    type: 'PUT',
    contentType: contType,
    url: '/v1/documents/?uri='+uri+'&temporal-collection='+tempColl,
    processData: false,
    data: data,
    success: success,
    error: fail
  });
  
}

function initNewXML(response) {
  var dialogArea = document.getElementById('newDocContents');
  dialogArea.value = '<record>\n';
  dialogArea.value += '  <'+ response.sysStart +'>2015-01-01T00:00:00Z</'+ response.sysStart +'>\n';
  dialogArea.value += '  <'+ response.sysEnd +'>2018-01-01T00:00:00Z</'+ response.sysEnd +'>\n';
  dialogArea.value += '  <'+ response.valStart +'>2009-01-01T00:00:00Z</'+ response.valStart +'>\n';
  dialogArea.value += '  <'+ response.valEnd +'>2017-01-01T00:00:00Z</'+ response.valEnd +'>\n';
  dialogArea.value += '  <data>Some cool data of yours</data>\n';
  dialogArea.value += '  <YourProperty>Your Own Data</YourProperty>\n';
  dialogArea.value += '</record>';
}

function initNewJSON(response) {
  var dialogArea = document.getElementById('newDocContents');
  dialogArea.value = '{\n  "'+ response.sysStart + '": \"2015-01-01T00:00:00Z\",\n';
  dialogArea.value += '\  "'+ response.sysEnd + '": \"2018-01-01T00:00:00Z\",\n';
  dialogArea.value += '\  "'+ response.valStart + '": \"2009-01-01T00:00:00Z\",\n';
  dialogArea.value += '\  "'+ response.valEnd + '": \"2017-01-01T00:00:00Z\",\n';
  dialogArea.value += '\  "data\": \"Some cool data\",\n';
  dialogArea.value += '\  "Your Own Property\": \"Your Own Data\"\n';
  dialogArea.value += '}';
}

function saveNewDoc(chart) {
  var data = document.getElementById('newDocContents').value.replace(/\n/g, '');
  data = jQuery.parseJSON(data);

  var dropDownList = document.getElementById('selectTempColl');
  var selectedColl = dropDownList.options[dropDownList.selectedIndex].value;
  var newURI = document.getElementById('newUri').value;

  var formatList = document.getElementById('docFormat');
  var format = formatList.options[formatList.selectedIndex].value;
 
  if (format === 'JSON') {
  } else {
    data = data.replace(/ /g, '');
  }

  $.ajax({
    url: '/v1/documents/?temporal-collection=' + selectedColl,
    uri: newURI,
    type: 'PUT',
    data: data,
    docData = JSON.stringify(data);
  } else {
    data = data.replace(/ /g, '');
    docData = jQuery.parseXML(data);
  }

  $.ajax({
    url: '/v1/documents/?uri='+newURI+'&temporal-collection='+selectedColl,
    type: 'PUT',
    data: data,
    processData: false,
    success: function(data) {
      loadData(selectedColl);
    },
    error: function(jqXHR, textStatus) {
      window.alert('The creation of your new document did not work.');
      $('#dialogCreateDoc').dialog('close');
    },
    contentType: 'application/' + format.toLowerCase(),
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
    $('#sysTimeDiv').removeClass('hideSysTimeBoxes');
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
  var docColl = $.ajax({
    url: '/v1/documents?uri='+uri+'&category=collections&format=json',
    success: function(data, textStatus) {},
    error: function(jqXHR, textStatus, errorThrown) {
      console.log('problem');
    },
    async: false,
  });

 return JSON.parse(docColl.responseText);
}

/*
@params:
collArr is an array of strings of collection names
tempCollArr is an array of objects with 'nameref' properties
*/
function findCommonColl(collArr, tempCollArr) {
  var response;
  while (!response) {
    for (var i in collArr) {
      for (var j in tempCollArr) {
        if (collArr[i] === tempCollArr[j].nameref) {
          response = collArr[i];
        }
      }
    }
  }
  return response;
}

var deleteDoc = function (chart) {
  var doc = chart.getLogicalURI();
  if (!doc) {
    window.alert('Select a document');
    return;
  }
  var collArr = getDocColls(doc);
  var tempCollections = getTemporalColl(doc);
  var tempCollArr = tempCollections['temporal-collection-default-list']['list-items']['list-item'];

  var tempColl;
  if (collArr && tempCollArr) {
    collArr = collArr.collections;
    tempColl = findCommonColl(collArr, tempCollArr);
  }

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

function deleteSuccess(response, tempColl, chart) {
  var tempDate = new Date(response[chart.getSystemEnd()]);
  var ajax = true;

  var url = '/v1/documents?uri=' + chart.getLogicalURI() + '&temporal-collection=' + tempColl;

  //Add a system time to ajax request if specified
  var sysBoxDate = document.getElementById('sysStartBox').value;
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
      success: function(data) {
        loadData(uri);
        $('#editButton').show();
        $('#viewButton').show();
        $('#deleteButton').show();
      },
      error: function(jqXHR, textStatus) {
        cancel(chart);
        window.alert('Delete didn\'t work, most likely an error in the date? Sample date: 2015-09-31T00:00:00Z');
      },
    });
  }
  else {
    cancel(chart);
    document.getElementById('deleteErrMessage').innerHTML = 'Error: System time does not go backward.'.bold() + ' Current time for temporal collection is ' + tempDate;
  }
  clearTextArea();
  $('#deleteButtonsDiv').addClass('hideSysTimeBoxes');
  $('#sysTimeDiv').addClass('hideSysTimeBoxes');
}

function setupDelete(chart) {
  var uri = chart.getCurrentURI();
  document.getElementById('deleteErrMessage').innerHTML = '';
  var date = moment().toISOString();
  date = date.split('.');
  $("#sysStartBox").val(date[0]);
  if (!uri) { // No uri selected
    return;
  }
  $('#editButton').hide();
  $('#viewButton').hide();
  $('#deleteButton').hide();
  $('#sysTimeDiv').removeClass('hideSysTimeBoxes');
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
          // for (var item in obj[prop]) {
          //   findProperties(obj[prop][item], newPath + '[' + item + ']', properties);
          // }
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

function initButtons() {
  document.getElementById('editButton').disabled = true;
  document.getElementById('deleteButton').disabled = true;
  document.getElementById('viewButton').disabled = true;
  document.getElementById('selectedURI').innerHTML = 'Selected URI: ' + 'null'.bold();
}

var getBarChart = function (params, docProp) {
  removeButtonEvents();
  var chart = drawChart(params, docProp);

  if (params) {
    addDataToMenu(chart, params);
  }
  if (params.timeRanges === null) {
    initButtons();
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
        },
        Cancel: function() {
          $(this).dialog('close');
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

  function XMLOrJSONTextForCollection() {
    var formatOption = $('#docFormat').find('option:selected').text();
    var tempColl = $('#selectTempColl').find('option:selected').text();
    if(tempColl !== 'Choose a temporal collection') {
      chart.getAxisSetup(tempColl, formatOption);
    }
  }

  $('#selectTempColl').change(function() {
    XMLOrJSONTextForCollection();
  });

  $('#docFormat').change(function() {
    XMLOrJSONTextForCollection();
  });

  $('#pick-doc').click(function () {
    var uriCollection = $('input[name = collection]').val();
    if(uriCollection === '') {
      window.alert('Please enter a uri.');
    }
    else {
      window.history.pushState('', 'Title', '/?collection='+uriCollection);
      loadData(uriCollection);
      cancel(chart);
    }
  });
};


