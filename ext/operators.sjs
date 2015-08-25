function get (context, params) {
  var collection = params.collection;
  var valPeriod;
  var sysPeriod;

  var valOperator = params.valSelectedOp;
  var sysOperator = params.sysSelectedOp;

  var result = {};
  var query = {};

  if(valOperator === 'None' && sysOperator === 'None') {
    query = cts.andQuery([
              cts.notQuery(cts.collectionQuery("lsqt")),   
              cts.collectionQuery(collection)                      
            ])
  }
  else {
    var valAxis = params.valAxis;
    var sysAxis = params.sysAxis;

    if(sysOperator !== 'None' && valOperator !== 'None') {
      valPeriod = cts.period(params.valStart, params.valEnd);
      sysPeriod = cts.period(params.sysStart, params.sysEnd);
      query = cts.andQuery([
                cts.collectionQuery(collection),
                cts.periodRangeQuery(valAxis, valOperator, valPeriod),
                cts.periodRangeQuery(sysAxis, sysOperator, sysPeriod)]
              )
    }
    else if(sysOperator === 'None') {
      valPeriod = cts.period(params.valStart, params.valEnd);
      query = cts.andQuery([
                cts.collectionQuery(collection),
                cts.periodRangeQuery(valAxis, valOperator, valPeriod)]
              )
    }
    else if(valOperator === 'None') {
      sysPeriod = cts.period(params.sysStart, params.sysEnd);
      query = cts.andQuery([
                cts.collectionQuery(collection),
                cts.periodRangeQuery(sysAxis, sysOperator, sysPeriod)]
              )
    }
  }

  result.values = fn.subsequence(cts.search(query), params.start, 10);
  result.collection = collection;
  result.totalLength = cts.estimate(query);

  var arrayValues = result.values.toArray();
  var uriArr = [];
  var collections = [];
  for(var i = 0; i<arrayValues.length; i++) {
    uriArr[i] = xdmp.nodeUri(arrayValues[i]);
    collections[i] = xdmp.documentGetCollections(uriArr[i]);
  }
  result.uri = uriArr;
  result.collections = collections;

  return result;
}

exports.GET = get;
