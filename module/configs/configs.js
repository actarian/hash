/* global angular, module */

window.console ? null : window.console = { log: function () { } };

module.constant('ngridModes', {
    SUM: 1,
    MIN: 2,
    MAX: 3,
    AVG: 4,
});
