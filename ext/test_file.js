function get (context, params) {
+
+  var period = cts.period(params.period);
+
+  var result = {
    values: cts.search(
+            cts.andQuery([
+              cts.collectionQuery(params.collection),
+              cts.periodRangeQuery(
+                 params.axis, params.operator, period )]))

    query: 'cts.search(
+            cts.andQuery([
+              cts.collectionQuery('+params.collection+'),
+              cts.periodRangeQuery('+
+                 params.axis+',' + params.operator+ ',' + period + ')]))'

   }
+
+  return result;
+}
+
+exports.GET = get;


function generateOps() {
var operators = ['None', 'ALN_EQUALS', 'ALN_CONTAINS', 'ALN_CONTAINED_BY', 'ALN_MEETS', 'ALN_MET_BY', 'ALN_BEFORE', 'ALN_AFTER', 'ALN_STARTS', 'ALN_STARTED_BY', 'ALN_FINISHES', 'ALN_FINISHED_BY', 'ALN_OVERLAPS', 'ALN_OVERLAPPED_BY', 'ISO_OVERLAPS', 'ISO CONTAINS', 'ISO_PRECEDES', 'ISO_SUCCEEDS', 'ISO_IMM_PRECEDES', 'ISO_IMM_SUCCEEDS', 'ISO_EQUALS'];

for( var i = 0; i < operators.length; i++ ) {
   $('#valDropdown').append($('<option>').text(operators[i]));
   $('#sysDropdown').append($('<option>').text(operators[i]));
+  }
+}
+
+function getSelected(id) {
+  var dropDownList = document.getElementById(id);
+  return dropDownList.options[dropDownList.selectedIndex].value;
+}
+
+$('#valDropdown').change(function() {
+  operatorChange('valDropdown', 'myValid');
+});
+
+$('#sysDropdown').change(function() {
+  operatorChange('sysDropdown', 'mySystem');
+});
+
+function operatorChange(id, axis) {
+  var selectedOp = getSelected(id);
+  var selectedColl = getSelected('dropdown');
+  $.ajax(
+    {
+      url: '/v1/resources/operators?rs:collection='+selectedColl+'&rs:axis='+axis+'&rs:operator='+selectedOp+'&rs:period=9999-12-31T23:59:59.99Z',
+      success: function(response, textStatus)
+      {
+        console.log(response.query);
+      },
+      error: function(jqXHR, textStatus, errorThrown)
+      {
+        console.log('problem');
+      }
+    });

