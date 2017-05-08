//HEAD 
(function(app) {
try { app = angular.module("ngrid"); }
catch(err) { app = angular.module("ngrid", []); }
app.run(["$templateCache", function($templateCache) {
"use strict";

$templateCache.put("ngrid/partials/ngrid","<div class=\"ngrid\">\n" +
    "    <div class=\"ngrid-inner\">\n" +
    "        <div class=\"ngrid-spacer\"></div>\n" +
    "        <div class=\"ngrid-table\" ng-transclude></div>\n" +
    "    </div>\n" +
    "    <div class=\"ngrid-info\"></div>\n" +
    "</div>")
}]);
})();