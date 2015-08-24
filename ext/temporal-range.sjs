function get(context, params) {

  var ltInfinity = xs.dateTime("9999-12-31T23:59:59.99Z").subtract(xs.yearMonthDuration('P1Y'));

  var sysAxis, sysStart, sysEnd, valAxis, valStart, valEnd;
  var temporal = require("/MarkLogic/temporal.xqy");

  sysAxis = temporal.collectionGetAxis(params.collection, "system");
  valAxis = temporal.collectionGetAxis(params.collection, "valid");

  sysStart = temporal.axisGetStart(sysAxis).toObject().elementReference.localname;
  sysEnd = temporal.axisGetEnd(sysAxis).toObject().elementReference.localname;
  valStart = temporal.axisGetStart(valAxis).toObject().elementReference.localname;
  valEnd = temporal.axisGetEnd(valAxis).toObject().elementReference.localname;

  var result = {};

  result.sysStart = cts.values(
    cts.elementReference(xs.QName(sysStart)),
    null,
    ["ascending","limit=1"],
    cts.collectionQuery(params.collection)
  );

  result.sysEnd = cts.values (
    cts.elementReference(xs.QName(sysEnd)),
    ltInfinity,
    ["descending","limit=1"],
    cts.collectionQuery(params.collection)
  );

  result.valStart = cts.values(
    cts.elementReference(xs.QName(valStart)),
    null,
    ["ascending","limit=1"],
    cts.collectionQuery(params.collection)
  );

  result.valEnd = cts.values (
    cts.elementReference(xs.QName(valEnd)),
    ltInfinity,
    ["descending","limit=1"],
    cts.collectionQuery(params.collection)
  );

  return result;

}

exports.GET = get;
