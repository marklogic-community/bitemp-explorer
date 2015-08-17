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
      console.log('got collections: ' + data);
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
        addToDrop.append($('<option>').text(dropArray[k])) ;
        if( k === 0 && search) {
          ajaxTimesCall(dropArray[k], null);
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
  document.getElementById('contents').value = '';
  document.getElementById('sysStartBox').value = '';
  document.getElementById('newDocContents').value = '';
}

function fillText(data, isEditing, id) {
  clearTextArea();

  var textArea = document.getElementById(id);

  if(data.contentType) {
    if(data.contentType.indexOf('xml') > -1) {//view xml doc
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
  }

  else {//view json doc
    textArea.value += '{';
    var strToAdd;
    for (var property in data) {
      strToAdd = '';
      if (data.hasOwnProperty(property)) {
        if ((property === 'sysStart' || property === 'sysEnd') && isEditing) {
          data[property] = 'null';
        }
        if (textArea.value !== '{') { //Add a comma onto previous line, if not on the first item.
          strToAdd += ',';
        }
        strToAdd += '\n\"' + property + '\": ';
        if (typeof data[property] === 'object') {
          strToAdd += JSON.stringify(data[property], null, 2);
        }
        else { // if the property has a null value then don't put quotes around it.
          if(data[property] !== 'null') {
            strToAdd += "\"" + data[property] + "\"";
          }
          else {
            strToAdd += data[property];
          }
        }
        textArea.value += strToAdd;
      }
    }
    textArea.value += '\n}';
    textArea.readOnly = !isEditing;

    function path(object, fullPath) {
      var selection = object;
      fullPath.split('.').forEach(function(path) {
        selection = selection[path];
      });
      return selection;
    }
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

  if (document.getElementById('sysStartBox').value) {
    data.sysStart = document.getElementById('sysStartBox').value;
  }

  var success = function() {
    cancel(chart);
  };
  var fail = function(data) {
    window.alert('PUT didn\'t work: ' + data);
  };
  console.log('Saving');   //Only working on mac, bug filed with MarkLogic
  $.ajax({
    type: 'PUT',
    contentType: 'application/json',
    url: '/v1/documents/?uri=' + chart.getCurrentURI()+'&temporal-collection=myTemporal',
    processData: false,
    data: JSON.stringify(data),
    success: success,
    error: fail
  });
}

function initNewXML() {
  var dialogArea = document.getElementById('newDocContents');
  dialogArea.value = '<record>\n';
  dialogArea.value += '  <sysStart>2015-01-01T00:00:00Z</sysStart>\n';
  dialogArea.value += '  <sysEnd>2018-01-01T00:00:00Z</sysEnd>\n';
  dialogArea.value += '  <valStart>2009-01-01T00:00:00Z</valStart>\n';
  dialogArea.value += '  <valEnd>2017-01-01T00:00:00Z</valEnd>\n';
  dialogArea.value += '  <data>Some cool data of yours</data>\n';
  dialogArea.value += '  <YourProperty>Your Own Data</YourProperty>\n';
  dialogArea.value += '</record>';
}

function initNewJSON() {
  var dialogArea = document.getElementById('newDocContents');
  dialogArea.value = '{\n\  "sysStart\": \"2015-01-01T00:00:00Z\",\n';
  dialogArea.value += '\  "sysEnd\": \"2018-01-01T00:00:00Z\",\n';
  dialogArea.value += '\  "valStart\": \"2009-01-01T00:00:00Z\",\n';
  dialogArea.value += '\  "valEnd\": \"2017-01-01T00:00:00Z\",\n';
  dialogArea.value += '\  "data\": \"Some cool data\",\n';
  dialogArea.value += '\  "Your Own Property\": \"Your Own Data\"\n';
  dialogArea.value += '}';
}

function saveNewDoc() {
  var data = document.getElementById('newDocContents').value.replace(/\n/g, '');

  var dropDownList = document.getElementById('selectTempColl');
  var selectedColl = dropDownList.options[dropDownList.selectedIndex].value;
  var newURI = document.getElementById('newUri').value;

  var formatList = document.getElementById('docFormat');
  var format = formatList.options[formatList.selectedIndex].value;
  var docData;

  if (format === 'JSON') {
    //docData = jQuery.parseJSON(data);
  } else {
    data = data.replace(/ /g, '');
    //docData = jQuery.parseXML(data);
  }
  $.ajax({
    url: '/v1/documents',
    uri: newURI,
    type: 'PUT',
    data: docData,
    success: function(data) {
      loadData(selectedColl);
    },
    error: function(jqXHR, textStatus) {
      window.alert('The creation of your new document did not work.');
      $('#dialogCreateDoc').dialog('close');
    },
    collection: selectedColl,
    format: format
  });
}

function setupTextArea(uri, isEditing) {
  $('#editButton').hide();
  $('#viewButton').hide();
  $('#deleteButton').hide();
  $('#cancelButton').show();
  $('#contents').show();

  if (isEditing) {
    $('#saveButton').show();
  }
   var successFunc = function(data) {
    fillText(data, isEditing, 'contents');
  };
  $.ajax({
    url: '/v1/documents/?uri=' + uri,
    success: successFunc,
    format: 'json'
  });

}

function view(uri) {
  if (uri) {
    setupTextArea(uri, false); //false so function knows the document is not being edited
    $('#sysTimeDiv').addClass('hideSysTimeBoxes');
  }
  else {
    window.alert('Please click a doc first');
  }
}

function edit(uri) {
  if (uri) {
    setupTextArea(uri, true); //true so function knows the document is being edited
    $('#sysTimeDiv').removeClass('hideSysTimeBoxes');
  }
  else {
    window.alert('Please click a doc first');
  }
}

//Gets all temporal collections the uri belongs to.
function getTemporalColl(uri) {
  var docColl = $.ajax({
    url: '/manage/v2/databases/Documents/temporal/collections?format=json',
    uri: uri,
    success: function(data, textStatus) {
     console.log('Success');
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
          console.log('Match: ' + collArr[i]);
          response = collArr[i];
        }
      }
    }
  }
  return response;
}

var deleteDoc = function (chart) {
  var uri = chart.getLogicalURI();
  if (!uri) {
    return;
  }
  var collArr = getDocColls(uri);
  var tempCollections = getTemporalColl(uri);
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
  var sysBoxDate;
  var tempDate = new Date(response.sysEnd);
  var ajax = true;
  var currDate = new Date();

  var url = '/v1/documents?uri=' + chart.getLogicalURI() + '&temporal-collection=' + tempColl;

  //Add a system time to ajax request if specified
  sysBoxDate = document.getElementById('sysStartBox').value;
  if (sysBoxDate) {
    url += '&system-time='+sysBoxDate;
    console.log('temporal date: ' + tempDate + ', specified date: ' + sysBoxDate);
    if (tempDate.valueOf() > sysBoxDate.valueOf()){
      document.getElementById('deleteErrMessage').innerHTML = 'Error: System time does not go backward.'.bold() + ' Current time is ' + tempDate;
      ajax=false;
    }
  }
  else if (currDate.valueOf() < tempDate.valueOf()) {
    ajax = false;
  }

  if (ajax) {
    $.ajax({
      url: url,
      type: 'DELETE',
      success: function(data) {
        console.log('uri: ' + uri);
        loadData(uri);
        $('#editButton').show();
        $('#viewButton').show();
        $('#deleteButton').show();
      },
      error: function(jqXHR, textStatus) {
        cancel(chart);
        window.alert('Delete didn\'t work, error code: ' + jqXHR.status);
      },
      format: 'json'
    });
  }
  else {
    cancel(chart);
    document.getElementById('deleteErrMessage').innerHTML = 'Error: System time does not go backward.'.bold() + ' Current time for temporal collection is ' + tempDate;
  }
  $('#deleteButtonsDiv').addClass('hideSysTimeBoxes');
  $('#sysTimeDiv').addClass('hideSysTimeBoxes');
}

function setupDelete(chart) {
  var uri = chart.getCurrentURI();
  document.getElementById('deleteErrMessage').innerHTML = '';
  if (!uri) { // No uri selected
    uri = 'addr.json';
  }
  else {
    var lastPeriodLoc = uri.lastIndexOf('.');
    var firstPeriodLoc = uri.indexOf('.');
    if (lastPeriodLoc !== firstPeriodLoc) { //More than one '.', indicates a big number within uri.
      uri = uri.substring(0, firstPeriodLoc) + uri.substring(lastPeriodLoc, uri.length); // Remove the big number.
    }
  }
  chart.setLogicalURI(uri);
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
    if(( docProp === 'data' && docProp !== 'valStart' ) || ( docProp !== 'data' && docProp === 'valStart' )) {
      propsInGraph['Choose a property'] = true;
    }
    else {
      propsInGraph[docProp] = true;
    }

    for(var i = 0; i < params.data.length; i++) {
      findProperties(params.data[i].content, null, propsInGraph);
    }
    var select = document.getElementById('select-prop');
    if(select) {
      for(var property in propsInGraph) {
        console.log(property)
        $('#select-prop').append($('<option>').text(property));
      }
    }
  }
}

function formatCreateDocArea() {
  var dropDownList = document.getElementById('docFormat');
  var selectedColl = dropDownList.options[dropDownList.selectedIndex].value;
  if (selectedColl === 'XML') {
    initNewXML();
  }
  else {
    initNewJSON();
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
    edit(chart.getCurrentURI());
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
    view(chart.getCurrentURI());
    chart.setViewing(true);
  });

  $('#saveButton').click(function() {
    save(chart);
  });

  $('#change-prop').click(function() {
    changeTextInGraph(chart, params);
  });

  $('#docFormat').change(function() {
    console.log('changing format of new doc');
    formatCreateDocArea();
  });

  addTempColls('selectTempColl', false);
  $('#createDoc').click(function() {
    $('#createDocStuff').show();
    initNewJSON();
    $('#dialogCreateDoc').dialog({
      autoOpen: true,
      modal: true,
      appendTo: false,
      width: 550,
      height: 500,
      buttons: {
        Save: function() {
          saveNewDoc();
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
};


