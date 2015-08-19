function get (context, params) {

  var collection = params.collection;

  var valPeriod;
  var sysPeriod;

  var uri = params.uri;

  var valAxis = params.valAxis;
  var valOperator = params.valSelectedOp;
  var sysAxis = params.sysAxis;
  var sysOperator = params.sysSelectedOp;

  var result;
  if(valAxis.length>0 && sysAxis.length>0) {
    valPeriod = cts.period(params.valStart, params.valEnd);
    sysPeriod = cts.period(params.sysStart, params.sysEnd);
    result = {
    values: 
      cts.search(
        cts.andQuery([
          cts.collectionQuery(collection),
          cts.periodRangeQuery(valAxis, valOperator, valPeriod),
          cts.periodRangeQuery(sysAxis, sysOperator, sysPeriod)]
        )
      )
    }
  }
  else if(valAxis.length>0) {
    valPeriod = cts.period(params.valStart, params.valEnd);
    result = {
      values: 
      cts.search(
        cts.andQuery([
          cts.collectionQuery(collection),
          cts.periodRangeQuery(valAxis, valOperator, valPeriod)]
        )
      )
    }
  }
  else if(sysAxis.length>0) {
    sysPeriod = cts.period(params.sysStart, params.sysEnd);
    result = {
      values:
      cts.search(
        cts.andQuery([
          cts.collectionQuery(collection),
          cts.periodRangeQuery(sysAxis, sysOperator, sysPeriod)]
        )
      )
    }
  }

  result.collection = collection;

  var arrayValues = result.values.toArray();
  var uriArr = [];
  for(var i = 0; i<arrayValues.length; i++) {
    uriArr[i] = xdmp.nodeUri(arrayValues[i]);
  }
  result.uri = uriArr;

  return result;
}

exports.GET = get;
