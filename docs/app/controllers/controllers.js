/* global angular, app */

app.controller('DemoCtrl', ['$scope', '$interval', 'Hash', 'Calendar', 'GanttRow', function($scope, $interval, Hash, Calendar, GanttRow) {

    var row = $scope.row = new GanttRow({
        activity: {
            id: 1000000 + getRandom(),
            name: 'Activity',
            budgetHours: 10 + Math.floor(Math.random() * 50),
        },
        project: {
            type: Math.floor(Math.random() * 5),
            deliveryDate: new Date(),
        },
    }, []);

    $scope.addItem = function() {
        var item = getRandomItem();
        row.slots.add(item);
        row.update();
        row.updateMonths();
        $scope.item = item;
        // console.log('addItem', item.id);
        log('addItem', item.id);
    };
    $scope.updateItem = function() {
        if ($scope.item) {
            var id = $scope.item.id;
            item = getRandomItem();
            item = angular.extend($scope.item, item);
            item.id = id;
            row.slots.add(item);
            row.update();
            row.updateMonths();
            $scope.item = item;
            log('updateItem', item.id);
        }
    };
    $scope.clearItems = function() {
        row.ranges.removeAll();
        row.months.removeAll();
        row.days.removeAll();
        row.slots.removeAll();
        row.update();
        row.updateMonths();
        delete $scope.item;
        log('clearItems');
    };

    var intervalId;
    $scope.start = function() {
        $scope.stop();
        intervalId = $interval($scope.addItem, 1000 / 60);
    };
    $scope.stop = function() {
        if (intervalId) {
            $interval.cancel(intervalId);
        }
    };

    function serializeDate(date) {
        function pad(v, s, z) {
            v = (v || 0) + '';
            s = (s || 2);
            z = (z || '0');
            return v.length >= s ? v : new Array(s - v.length + 1).join(z) + v;
        }
        var yyyy = date.getFullYear();
        var MM = date.getMonth() + 1; // getMonth() is zero-based
        var dd = date.getDate();
        var hh = date.getHours();
        var mm = date.getMinutes();
        var ss = date.getSeconds();
        return yyyy + '-' + pad(MM) + '-' + pad(dd) + 'T' + pad(hh) + ':' + pad(mm) + ':' + pad(ss);
    }

    function getRandom() {
        return 1000000 + Math.floor(Math.random() * 100000);
    }

    function getRandomDay() {
        const oneday = (24 * 60 * 60 * 1000);
        var date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 60));
        // date.setMonth(date.getMonth() + Math.floor(Math.random() * 2));
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        var yyyy = date.getFullYear();
        var MM = date.getMonth();
        var key = Math.ceil(date.getTime() / oneday);
        var mKey = yyyy * 12 + MM;
        return {
            key: key,
            mKey: mKey,
            date: serializeDate(date)
        };
    }

    var uid = 1;

    function getRandomItem() {
        var day = getRandomDay();
        var item = {
            id: uid,
            hours: 1 + Math.floor(Math.random() * 6),
            date: new Date(day.date),
            key: day.key,
            mKey: day.mKey,
            activityId: row.id,
        };
        if (Math.floor(Math.random() * 3) == 0) {
            item.taskId = 10000 + Math.floor(Math.random() * 50);
        }
        uid++;
        return item;
    }

    function log() {
        $scope.log = Array.prototype.slice.call(arguments);
    }
}]);


app.constant('ganttGroups', {
    ACTIVITY: 1,
    CUSTOMER: 2,
    DEPARTMENT: 3,
    GROUP: 4,
    MANAGER: 5,
    PROJECT: 6,
    RESOURCE: 7,
    USER: 9,
});

app.factory('Hash', [function() {
    var pools = {};

    function Hash(key, pool) {
        key = key || 'id';
        pool = pool ? Hash.get(pool) : {};
        Object.defineProperties(this, {
            key: {
                value: key,
                enumerable: false,
                writable: false
            },
            pool: {
                value: pool,
                enumerable: false,
                writable: false
            },
            length: {
                value: 0,
                enumerable: false,
                writable: true
            }
        });
    }

    function has(id) {
        return this.pool[id] !== undefined;
    }

    function getId(id) {
        return this.pool[id];
    }

    function get(item) {
        var hash = this,
            key = this.key;
        return item ? hash.getId(item[key]) : null;
    }

    function set(item) {
        var hash = this,
            pool = this.pool,
            key = this.key;
        pool[item[key]] = item;
        hash.push(item);
        return item;
    }

    function add(newItem) {
        var hash = this;
        var item = hash.get(newItem);
        if (item) {
            for (var i = 0, keys = Object.keys(newItem), p; i < keys.length; i++) {
                p = keys[i];
                item[p] = newItem[p];
            }
        } else {
            item = hash.set(newItem);
        }
        return item;
    }

    function remove(oldItem) {
        var hash = this,
            pool = this.pool,
            key = this.key;
        var item = hash.get(oldItem);
        if (item) {
            var index = hash.indexOf(item);
            if (index !== -1) {
                hash.splice(index, 1);
            }
            delete pool[item[key]];
        }
        return hash;
    }

    function addMany(items) {
        var hash = this;
        if (!items) {
            return hash;
        }
        var i = 0;
        while (i < items.length) {
            hash.add(items[i]);
            i++;
        }
        return hash;
    }

    function removeMany(items) {
        var hash = this;
        if (!items) {
            return hash;
        }
        var i = 0;
        while (i < items.length) {
            hash.remove(items[i]);
            i++;
        }
        return hash;
    }

    function removeAll() {
        var hash = this,
            key = hash.key,
            pool = hash.pool;
        var i = 0,
            t = hash.length,
            item;
        while (hash.length) {
            item = hash.shift();
            delete pool[item[key]];
            i++;
        }
        return hash;
    }

    function each(callback) {
        var hash = this;
        if (callback) {
            var i = 0;
            while (i < hash.length) {
                callback(hash[i], i);
                i++;
            }
        }
        return hash;
    }

    function forward(key, reverse) {
        var hash = this,
            key = (key || this.key);
        hash.sort(function(c, d) {
            var a = reverse ? d : c;
            var b = reverse ? c : d;
            return a[key] - b[key];
        });
        return hash;
    }

    function backward(key) {
        return this.forward(key, true);
    }

    function differs(hash) {
        if (hash.key !== this.key || hash.length !== this.length) {
            return true;
        } else {
            var differs = false,
                i = 0,
                t = this.length,
                key = this.key;
            while (differs && i < t) {
                differs = this[i][key] !== hash[i][key];
                i++;
            }
        }
    }

    function updatePool() {
        var hash = this,
            pool = this.pool,
            key = this.key;
        Object.keys(pool).forEach(function(key) {
            delete pool[key];
        });
        angular.forEach(hash, function(item) {
            pool[item[key]] = item;
        });
    }
    Hash.get = function(pool) {
        return pools[pool] = (pools[pool] || {});
    };
    Hash.prototype = new Array;
    Hash.prototype.has = has;
    Hash.prototype.getId = getId;
    Hash.prototype.get = get;
    Hash.prototype.set = set;
    Hash.prototype.add = add;
    Hash.prototype.remove = remove;
    Hash.prototype.each = each;
    Hash.prototype.addMany = addMany;
    Hash.prototype.removeMany = removeMany;
    Hash.prototype.removeAll = removeAll;
    Hash.prototype.forward = forward;
    Hash.prototype.backward = backward;
    Hash.prototype.differs = differs;
    Hash.prototype.updatePool = updatePool;
    return Hash;
}]);

app.factory('Calendar', ['Hash', function(Hash) {
    const oneday = (24 * 60 * 60 * 1000);
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    var todayKey = Math.ceil(today.getTime() / oneday);
    ArrayFrom = function(len, callback) {
        var a = [];
        while (a.length < len) {
            a.push(callback(a.length));
        }
        return a;
    };
    var months = new Hash('mKey');

    function Calendar() {}
    Calendar.getDate = function(day) {
        if (typeof day.date.getMonth === 'function') {
            return day.date;
        } else {
            return new Date(day.date);
        }
    };
    Calendar.clearMonth = function(month) {
        month.days.each(function(day) {
            if (day) {
                day.hours = 0;
                day.tasks = [];
            }
        });
    };
    Calendar.getMonth = function(day) {
        today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        todayKey = Math.ceil(today.getTime() / oneday);
        //
        var date = Calendar.getDate(day);
        var yyyy = date.getFullYear();
        var MM = date.getMonth();
        var key = Math.ceil(date.getTime() / oneday);
        var mKey = yyyy * 12 + MM;
        var month = months.getId(mKey);
        if (!month) {
            var fromDay = new Date(yyyy, MM, 1).getDay();
            var monthDays = new Date(yyyy, MM + 1, 0).getDate();
            var weeks = Math.ceil(monthDays / 7);
            var month = {
                date: date,
                mKey: mKey,
                month: MM,
                monthDays: monthDays,
                fromDay: fromDay,
                days: new Hash('key'),
            };
            month.weeks = ArrayFrom(weeks, function(r) {
                var days = ArrayFrom(7, function(c) {
                    var item = null;
                    var d = r * 7 + c - (fromDay - 1);
                    if (d >= 0 && d < monthDays) {
                        var date = new Date(yyyy, MM, d + 1);
                        var key = Math.ceil(date.getTime() / oneday);
                        item = {
                            $today: key === todayKey,
                            c: c,
                            r: r,
                            d: d + 1,
                            date: date,
                            key: key,
                            hours: 0,
                            tasks: [],
                        };
                        item = month.days.add(item);
                    }
                    return item;
                });
                return {
                    r: r,
                    days: days,
                }
            });
            month = months.add(month);
        }
        return month;
    };
    Calendar.getDay = function(days) {
        var date = new Date(today);
        date.setDate(date.getDate() + days);
        return date;
    };
    Calendar.getKey = function(date) {
        return Math.ceil(date.getTime() / oneday);
    };
    return Calendar;
}]);

app.factory('GanttRow', ['Hash', 'Calendar', 'ganttGroups', function(Hash, Calendar, ganttGroups) {
    var uid = 1;

    const oneday = (24 * 60 * 60 * 1000);
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    var todayKey = Math.ceil(today.getTime() / oneday);

    function GanttRow(data, colors) {
        this.type = ganttGroups.ACTIVITY;
        this.assignedHours = 0;
        this.slots = new Hash('id');
        this.days = new Hash('key');
        this.months = new Hash('mKey');
        this.ranges = new Hash('rKey');
        this.tasks = new Hash('id'); // 'taskId'
        // angular.isObject(data) ? angular.extend(this, data) : null;
        if (data) {
            this.id = data.activity.id;
            this.name = data.activity.name;
            this.budgetHours = data.activity.budgetHours;
            this.useBudget = data.project.type !== 2 && data.project.type !== 4;
            this.customer = data.customer;
            this.department = data.department;
            this.manager = data.manager;
            this.project = data.project;
            this.resource = data.resource;
            this.color = colors[this.id % (colors.length || 1)];
        }
        // this.items = new Hash().fill(data.items);
        this.lastTaskId = null;
        this.update();
    }
    GanttRow.prototype = {
        canSelect: function() {
            return this.type === ganttGroups.ACTIVITY && this.budgetHours > 0;
        },
        canEdit: function() {
            return this.canSelect() && this.resource.name.toLowerCase().indexOf('nondefinito') === -1;
        },
        mergeSlot: function(slot) {
            var slots = this.slots;
            slot.hours ? slots.add(slot) : slots.remove(slot);
        },
        insertSlot: function(key, hours, taskId) {
            var slot = null;
            this.useBudget ? hours = Math.min(hours, this.budgetHours - this.assignedHours) : null;
            hours = Math.max(0, hours);
            if (hours > 0) {
                var item = {
                    id: 'temp-' + (uid++),
                    key: key,
                    date: new Date(key * oneday),
                    hours: hours,
                    activityId: this.id,
                };
                if (taskId) {
                    item.taskId = taskId;
                    this.lastTaskId = taskId;
                }
                this.slots.add(item);
                slot = this.slots.getId(item.id);
            }
            this.update();
            return slot;
        },
        removeSlots: function(key) {
            var day = this.days.getId(key);
            day.tasks.each(function(item) {
                item.hours = 0;
            });
            var slots = day.tasks.slice();
            this.slots.removeMany(slots);
            this.update();
            return slots;
        },
        toggleSlots: function(key, hours) {
            if (this.days.has(key)) {
                return this.removeSlots(key);
            } else {
                var slot = this.insertSlot(key, hours, this.lastTaskId);
                return [slot];
            }
        },
        // WRITE CANCEL DAY SLOT
        assign: function(col, value) {
            console.log('assign');
            var slots = this.slots,
                key = col.$key;
            var item = {
                // errore
                id: 'temp-' + (uid++),
                key: key,
                date: col.$date,
                hours: value || 0,
                activityId: this.id,
            };
            value ? slots.add(item) : slots.remove(item);
            this.update();
            return this.days.getId(key);
        },
        write: function(col, value, max) {
            value = Math.min(value, max);
            this.useBudget ? value = Math.min(value, this.budgetHours - this.assignedHours) : null;
            value = Math.max(0, value);
            if (value && !this.days.has(col.$key) && col.$date >= today) {
                return this.assign(col, value);
            }
        },
        erase: function(col, value, max) {
            if (this.days.has(col.$key) && col.$date >= today) {
                return this.assign(col, null);
            }
        },
        toggle: function(col, value, max) {
            if (this.days.has(col.$key)) {
                return this.erase(col, value, max);
            } else {
                return this.write(col, value, max);
            }
        },
        // WRITE CANCEL DAY SLOT
        update: function() {
            var total = 0;
            var slots = this.slots,
                days = this.days;
            days.removeAll();
            var taskId = null;
            slots.each(function(item) {
                taskId = item.taskId || taskId;
                total += item ? item.hours : 0;
                var day = days.add({
                    key: item.key,
                    date: item.date,
                    hours: 0,
                });
                day.tasks = day.tasks || new Hash('id'); // 'taskId'
                day.tasks.add(angular.copy(item));
                day.tasks.each(function(task) {
                    day.hours += task.hours;
                });
            });
            this.lastTaskId = taskId || this.lastTaskId;
            days.forward(); // sort by key       
            this.assignedHours = total;
            this.updateRanges();
        },
        updateMonths: function() {
            var days = this.days,
                months = this.months;
            months.removeAll();
            var previous;
            days.each(function(item) {
                var month = Calendar.getMonth(item);
                if (month !== previous) {
                    previous = month;
                    Calendar.clearMonth(month);
                }
                months.add(month);
                var day = month.days.getId(item.key);
                if (day) {
                    day.hours = item.hours;
                    day.tasks = item.tasks;
                }
            });
            months.forward(); // sort by key  
        },
        updateRanges: function() {
            var days = this.days,
                ranges = this.ranges;
            ranges.removeAll();
            var rKey = 0,
                lastDay;
            days.each(function(day, i) {
                if (lastDay) {
                    if (day.key - lastDay.key > 1 || day.tasks.differs(lastDay.tasks)) {
                        rKey++;
                    }
                }
                lastDay = day;
                var range = ranges.add({
                    rKey: rKey,
                });
                range.days = range.days || [];
                range.days.push(day.key);
            });
            ranges.forward(); // sort by key   
        },
        getRange: function(col, from, to) {
            var ranges = this.ranges,
                range = null,
                key = col.$key;
            ranges.each(function(item) {
                var index = item.days.indexOf(key);
                if (index !== -1) {
                    item.c = index;
                    item.firstKey = Math.max(from, item.days[0]);
                    item.lastKey = Math.min(to, item.days[item.days.length - 1]);
                    range = item;
                }
            });
            return range;
        },
        updateRange: function(col, from, to) {
            var ranges = this.ranges,
                range = this.getRange(col, from, to);
            if (range) {
                range.previousKey = null;
                range.nextKey = null;
                var r = range.rKey;
                if (r > 0) {
                    var p = ranges[r - 1];
                    range.previousKey = p.days[p.days.length - 1];
                }
                if (r < ranges.length - 1) {
                    var n = ranges[r + 1];
                    range.nextKey = n.days[0];
                }
            }
            return range;
        },
        canMoveRange: function(range, dir) {
            // rifare !!!
            var can = true;
            var row = this;
            var first = range.items[0];
            var last = range.items[range.items.length - 1];
            var key = row.getOffsetKey(first.startDate, dir);
            var i = 0,
                t = range.items.length;
            while (i < t) {
                var k = key + i;
                if (k < todayKey || (row.days.getId(k) && range.items.indexOf(row.days.getId(k)) === -1)) { // sistemare!!
                    can = false;
                    i = t;
                }
                i++;
            }
            return can;
        },
        moveRange: function(range, dir) {
            if (range.items.length) {
                var row = this;
                if (row.canMoveRange(range, dir)) {
                    angular.forEach(range.items, function(item) {
                        row.addDays(item, dir);
                    });
                    row.update();
                }
            }
        },
        addDays: function(item, days) {
            // console.log('GanttRow.addDay', item, days);
            var date = new Date(item.startDate);
            date.setDate(date.getDate() + days);
            item.date = date;
            item.key = Math.ceil(date.getTime() / oneday);
            return item;
        },
        getOffsetKey: function(date, day) {
            var date = new Date(date);
            date.setDate(date.getDate() + day);
            var key = Math.ceil(date.getTime() / oneday);
            return key;
        },
        getHours: function(key) {
            var hours = 0;
            var day = this.days.getId(key);
            if (day) {
                day.tasks.each(function(task) {
                    hours += task.hours;
                });
            }
            return hours;
        },
        toggleOpened: function() {
            // console.log('toggleOpened');
            this.opened = !this.opened;
        },
        compress: function(key) {
            if (!this.items.length) {
                return;
            }
            this.items.sort(function(a, b) {
                return a.key - b.key;
            });
            var item = Utils.where(this.items, { key: key });
            item = item || this.items[0];
            var index = this.items.indexOf(item);
            var i = index,
                t = this.items.length;
            key = Math.max(key, todayKey);
            // da rifare
            // collezionare ore totali
            // redistribuire records in base a carico giornaliero
            // spostare su gantt
            while (i < t) {
                var item = this.items[i];
                item.key = key + i - index;
                item.date = new Date(item.key * oneday);
                i++;
            }
            this.update();
        },
    }
    GanttRow.serialNumber = function(number, max) {
        return new Array((1 + (max.toString().length) - (number.toString().length))).join('0');
    };
    return GanttRow;
}]);