function get (context, params) {
  var collection = params.collection;
  var valPeriod;
  var sysPeriod;

  var valOperator = params.valSelectedOp;
  var sysOperator = params.sysSelectedOp;

  var result = {};

  if(valOperator === 'None' && sysOperator === 'None') {
    result.values = 
      fn.subsequence(
        cts.search(
          cts.andQuery([
            cts.notQuery(cts.collectionQuery("lsqt")),   
            cts.collectionQuery(collection)                      
          ])
        ), params.start, 10
      )
    result.collection = collection;
  }
  else {
    var valAxis = params.valAxis;
    var sysAxis = params.sysAxis;

    if(sysOperator !== 'None' && valOperator !== 'None') {
      valPeriod = cts.period(params.valStart, params.valEnd);
      sysPeriod = cts.period(params.sysStart, params.sysEnd);
      result = {
      values: 
        fn.subsequence(
          cts.search(
            cts.andQuery([
              cts.collectionQuery(collection),
              cts.periodRangeQuery(valAxis, valOperator, valPeriod),
              cts.periodRangeQuery(sysAxis, sysOperator, sysPeriod)]
            )
          ), params.start, 10
        )
      }
    }
    else if(sysOperator === 'None') {
      valPeriod = cts.period(params.valStart, params.valEnd);
      result = {
      values: 
        fn.subsequence(
          cts.search(
            cts.andQuery([
              cts.collectionQuery(collection),
              cts.periodRangeQuery(valAxis, valOperator, valPeriod)]
            )
          ), params.start, 10
        )
      }
    }
    else if(valOperator === 'None') {
      sysPeriod = cts.period(params.sysStart, params.sysEnd);
      result = {
      values:
        fn.subsequence(
          cts.search(
            cts.andQuery([
              cts.collectionQuery(collection),
              cts.periodRangeQuery(sysAxis, sysOperator, sysPeriod)]
            )
          ), params.start, 10
        )
      }
    }
  }
  result.collection = collection;

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
