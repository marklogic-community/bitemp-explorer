/*global d3 */

function clearTextArea() {
  document.getElementById('contents').value = '';
}

function fillText(data, isEditing) {
  clearTextArea();
  var textArea = document.getElementById('contents');
  textArea.value += '{';
  for (var property in data) {
    if (data.hasOwnProperty(property)) {
      if ((property === 'sysStart' || property === 'sysEnd') && isEditing) {
        data[property] = null;
      }
      if (textArea.value === '{') {
        textArea.value += '\n\"' + property + '\": ' + '\"'+ data[property] +'\"';
      }
      else {
        textArea.value += ',\n\"' + property + '\": ' + '\"'+ data[property] +'\"';
      }
    }
  }
  textArea.value += '\n}';
  textArea.readOnly = !isEditing;
}

function save(chart) {
  data = document.getElementById('contents').value.replace(/\n/g, '');
  data = jQuery.parseJSON(data);
  console.log('Here\'s the parsed data object: ');
  console.log(data);

 /* declareUpdate();
  var temporal=require("/MarkLogic/temporal.xqy");
  temporal.documentInsert("myTemporal","addr.json",data);
  temporal.statementSetSystemTime(data.sysStart);*/

  var success = function() {
    alert('PUT call worked, closing textbox.');
    cancel(chart);
  };
  var fail = function(data) {
    alert('PUT didn\'t work: ' + data);
  };
  console.log('Saving');   // Almost close to working
  $.ajax({
    type: 'PUT',
    contentType: "application/json",
    url: 'http://localhost:3000/v1/documents/?uri=' + chart.getCurrentURI()+'&temporal-collection=myTemporal',
    processData: false,
    data: JSON.stringify(data),
    success: success,
    error: fail
  });
 //How should the browser appearance behave here? ex. close edit box?
}

function setupTextArea(uri, isEditing) {
  $('#editButton').hide();
  $('#viewButton').hide();
  $('#cancelButton').show();
  $('#contents').show();
  if (isEditing) {
    $('#saveButton').show();
  }
   var successFunc = function(data) {
    console.log('Calling fill text, data = ' + data);
    fillText(data, isEditing);
  };
  $.ajax({
    url: 'http://localhost:3000/v1/documents/?uri=' + uri,
    success: successFunc,
    format: 'json'
  });


}


function cancel(chart) {
  clearTextArea();
  $('#editButton').show();
  $('#viewButton').show();
  $('#cancelButton').hide();
  $('#contents').hide();
  $('#saveButton').hide();
  chart.setEditing(false);
  chart.setViewing(false);
  chart.setCurrentURI(undefined);
}

function view(uri) {
  if (uri) {
    setupTextArea(uri, false); //false so function knows the document is not being edited
  }
}

function edit(uri) {
  console.log('Editing ' + uri);
  if (uri) {
    setupTextArea(uri, true); //true so function knows the document is being edited
  }
}

function changeTextInGraph(chart, params) {
  var docProp = $('input[name = documentProperty]').val();
  if(docProp === '') {
    window.alert('Please enter a document property.');
  }
  else {
    var chart = barChart()
    .data(params.data)
    .width(params.width)
    .height(params.height)
    .setDisplayProperty(docProp);

    var selector = '#' + params.containerId;
    d3.select(selector + ' .chart').remove();
    var chartDiv = d3.select(selector).append('div').classed('chart', true).call(chart);


  }
}


var getBarChart = function (params) {
  var chart = barChart()
    .data(params.data)
    .width(params.width)
    .height(params.height);

  var selector = '#' + params.containerId;
  d3.select(selector + ' .chart').remove();
  var chartDiv = d3.select(selector).append('div').classed('chart', true).call(chart);

  $('#editButton').click(function() {
    edit(chart.getCurrentURI());
  });
  $('#cancelButton').click(function() {
    cancel(chart);
  });
  $('#viewButton').click(function() {
    view(chart.getCurrentURI());
  });
  $('#saveButton').click(function() {
    save(chart);
  });
  $('#change-prop').click(function() {
    changeTextInGraph(chart, params);
  });
}