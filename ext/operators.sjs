function get (context, params) {

  var collection = params.collection;

  var valPeriod;
  var sysPeriod;

  var uri = params.uri;

  var valAxis = params.valAxis;
  var sysAxis = params.sysAxis;
  
  var valOperator = params.valSelectedOp;
  var sysOperator = params.sysSelectedOp;

  var result;
  if (valAxis.length > 0 && sysAxis.length > 0) {
    valPeriod = cts.period(params.valStart, params.valEnd);
    sysPeriod = cts.period(params.sysStart, params.sysEnd);
    result = {
      values: cts.search(
        cts.andQuery([
          cts.collectionQuery(collection),
          cts.periodRangeQuery(valAxis, valOperator, valPeriod),
          cts.periodRangeQuery(sysAxis, sysOperator, sysPeriod)]
        )
      ),
      query: 'cts.search(\n' + '&emsp;cts.andQuery([\n' + '&emsp;&emsp;cts.collectionQuery("'+collection+'"),\n' + '&emsp;&emsp;cts.periodRangeQuery(\n' + '&emsp;&emsp;&emsp;"' + valAxis +'",\n'+ '&emsp;&emsp;&emsp;"' + valOperator +'",\n'+ '&emsp;&emsp;&emsp;' + 'cts.period(\n' + '&emsp;&emsp;&emsp;&emsp;xs.dateTime("'+params.valStart+'"),\n' + '&emsp;&emsp;&emsp;&emsp;xs.dateTime("'+params.valEnd+'")\n' + '&emsp;&emsp;&emsp;)\n' + '&emsp;&emsp;),\n' + '&emsp;&emsp;cts.periodRangeQuery(\n' + '&emsp;&emsp;&emsp;"' + sysAxis +'",\n'+ '&emsp;&emsp;&emsp;"' + sysOperator +'",\n'+ '&emsp;&emsp;&emsp;' + 'cts.period(\n' + '&emsp;&emsp;&emsp;&emsp;xs.dateTime("'+params.sysStart+'"),\n' + '&emsp;&emsp;&emsp;&emsp;xs.dateTime("'+params.sysEnd+'")\n' + '&emsp;&emsp;&emsp;)\n' + '&emsp;&emsp;)]\n' + '&emsp;)\n' + ')'
    }
  }
  else if (valAxis.length > 0) {
    valPeriod = cts.period(params.valStart, params.valEnd);
    result = {
      values: cts.search(
        cts.andQuery([
          cts.collectionQuery(collection),
          cts.periodRangeQuery(valAxis, valOperator, valPeriod)]
        )
      ),
      query: 'cts.search(\n' + '&emsp;cts.andQuery([\n' + '&emsp;&emsp;cts.collectionQuery("'+collection+'"),\n' + '&emsp;&emsp;cts.periodRangeQuery(\n' + '&emsp;&emsp;&emsp;"' + valAxis +'",\n'+ '&emsp;&emsp;&emsp;"' + valOperator +'",\n'+ '&emsp;&emsp;&emsp;' + 'cts.period(\n' + '&emsp;&emsp;&emsp;&emsp;xs.dateTime("'+params.valStart+'"),\n' + '&emsp;&emsp;&emsp;&emsp;xs.dateTime("'+params.valEnd+'")\n' + '&emsp;&emsp;&emsp;)\n' + '&emsp;&emsp;)]\n' +'&emsp;)\n' + ')'
    }
  }
  else if (sysAxis.length > 0) {
    sysPeriod = cts.period(params.sysStart, params.sysEnd);
    result = {
      values: cts.search(
        cts.andQuery([
          cts.collectionQuery(collection),
          cts.periodRangeQuery(sysAxis, sysOperator, sysPeriod)]
        )
      ),
      query: 'cts.search(\n' + '&emsp;cts.andQuery([\n' + '&emsp;&emsp;cts.collectionQuery("'+collection+'"),\n' + '&emsp;&emsp;cts.periodRangeQuery(\n' + '&emsp;&emsp;&emsp;"' + sysAxis +'",\n'+ '&emsp;&emsp;&emsp;"' + sysOperator +'",\n'+ '&emsp;&emsp;&emsp;' + 'cts.period(\n' + '&emsp;&emsp;&emsp;&emsp;xs.dateTime("'+params.sysStart+'"),\n' + '&emsp;&emsp;&emsp;&emsp;xs.dateTime("'+params.sysEnd+'")\n' + '&emsp;&emsp;&emsp;)\n' + '&emsp;&emsp;)]\n' +'&emsp;)\n' + ')'
    }
  }
  result.collection = collection;
  return result;
}

exports.GET = get;
