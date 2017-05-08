/* global angular, module */

module.directive('ngrid', ['$window', '$templateCache', '$templateRequest', '$interpolate', '$compile', '$timeout', 'Utils', function($window, $templateCache, $templateRequest, $interpolate, $compile, $timeout, Utils) {
    // polyfill for trim >= IE9
    function trimWhiteSpace(string) {
        return string.replace(/^\s+|\s+$/gm, '');
    }
    return {
        priority: 1, 
        restrict: 'A',
        replace: true,
        /*
        // with scope attributes watch won't work anymore
        scope: {
            options: '=?ngrid',
        },
        */
        templateUrl: 'ngrid/partials/ngrid',
        transclude: true,
        controller: ['$transclude', '$attrs', function($transclude, $attrs) {
            $transclude(function(clone, scope) {
                var htmls = Array.prototype.slice.call(clone).filter(function(native) {
                    // trim whitespaces
                    return (native.nodeType !== 3 || /\S/.test(native.nodeValue));
                }).map(function(native) {
                    var html = native.outerHTML;
                    /*
                    if (native && native.parentNode) {
                        native.parentNode.removeChild(native);
                    }
                    */
                    return html;
                });
                htmls = htmls.join('');
                var element = angular.element('<div>' + htmls + '</div>');
                var native = element[0];
                var nativeRow = native.querySelector('.ngrid-row');
                if (nativeRow && nativeRow.parentNode) {
                    nativeRow.parentNode.removeChild(nativeRow);
                    $attrs.templateRow = trimWhiteSpace(nativeRow.outerHTML);
                    // console.log($attrs.templateRow);
                }
                var nativeCol = native.querySelector('.ngrid-col');
                if (nativeCol && nativeCol.parentNode) {
                    nativeCol.parentNode.removeChild(nativeCol);
                    $attrs.templateCol = trimWhiteSpace(nativeCol.outerHTML);
                    // console.log($attrs.templateCol);
                }
                var nativeCell = native.querySelector('.ngrid-cell');
                if (nativeCell && nativeCell.parentNode) {
                    nativeCell.parentNode.removeChild(nativeCell);
                    $attrs.templateCell = trimWhiteSpace(nativeCell.outerHTML);
                    // console.log($attrs.templateCell);
                }
            });
        }],
        link: function(scope, element, attributes, model, transclude) {
            // console.log(attributes);
            var templateRow, templateCol, templateCell;
            if (attributes.templateRow !== undefined) {
                templateRow = attributes.templateRow;
                attributes.templateRow = null;
            }
            if (attributes.templateCol !== undefined) {
                templateCol = attributes.templateCol;
                attributes.templateCol = null;
            }
            if (attributes.templateCell !== undefined) {
                templateCell = attributes.templateCell;
                attributes.templateCell = null;
            }
            var native = element[0],
                nativeInner = native.querySelector('.ngrid-inner'),
                nativeSpacer = native.querySelector('.ngrid-spacer'),
                nativeTable = native.querySelector('.ngrid-table'),
                nativeInfo = native.querySelector('.ngrid-info'),
                tableElement = angular.element(nativeTable),
                layout = scope.layout = {
                    grid: {
                        width: 0,
                        height: 0,
                    },
                    table: {
                        width: 0,
                        height: 0,
                        x: 0,
                        y: 0,
                    },
                    cell: {
                        width: attributes.width !== undefined ? parseInt(attributes.width) : 100,
                        height: attributes.height !== undefined ? parseInt(attributes.height) : 30,
                    },
                    scroll: {
                        x: 0,
                        y: 0,
                    },
                    rows: {},
                    cols: {},
                    visibles: [],
                },
                rows, cols;
          
            
            function updateRows() {
                var total = layout.rows.total,
                    dirty = false, from, to, count;
                if (total > 0) {
                    count = Math.ceil(layout.grid.height / layout.cell.height) + 1;
                    from = Math.floor(layout.scroll.y / layout.cell.height);
                    from = Math.max(0, Math.min(total - count + 1, from));
                    to = Math.min(rows.length, from + count);
                } else {
                    count = to = 1;
                    from = 0;
                }
                dirty = (from !== layout.rows.from) || (to !== layout.rows.to);
                layout.rows.dirty = dirty;
                layout.rows.from = from;
                layout.rows.to = to;
                layout.rows.count = count;
            }

            function updateCols() {
                var total = layout.cols.total,
                    dirty = false, from, to, count;
                if (total > 0) {
                    count = Math.ceil(layout.grid.width / layout.cell.width) + 1;
                    from = Math.floor(layout.scroll.x / layout.cell.width);
                    from = Math.max(0, Math.min(total - count + 1, from));
                    to = Math.min(cols.length, from + count);
                } else {
                    count = to = 1;
                    from = 0;
                }
                dirty = (from !== layout.cols.from) || (to !== layout.cols.to);
                layout.cols.dirty = dirty;
                layout.cols.from = from;
                layout.cols.to = to;
                layout.cols.count = count;
            }

            /*
            function drawRows() {
                // console.log('drawRows');
                var dirty = layout.rows.dirty,
                    from = layout.rows.from,
                    count = layout.rows.count,
                    visibles = layout.visibles,
                    template = templateCell,
                    targetElement = tableElement;
                if (dirty) {
                    angular.forEach(visibles, function(item, i) {
                        if (i < count) {
                            var $scope = getCell(i);
                            if (!$scope.$$phase) {
                                $scope.$digest();
                            }
                        }
                    });
                }
                while (visibles.length < count) {
                    var $scope = getCell(visibles.length);
                    var compiled = $compile(template)($scope, function(cloned) {
                        compiled = cloned;
                    });
                    var $element = angular.element(compiled);
                    var nativeElement = $element[0];
                    nativeElement.style.width = '100%';
                    nativeElement.style.height = layout.cell.height + 'px';
                    targetElement.append($element);
                    visibles.push({
                        element: $element,
                        scope: $scope,
                    });
                }
            }

            function drawCols() {
                // console.log('drawCols');
                var dirty = layout.cols.dirty,
                    from = layout.cols.from,
                    count = layout.cols.count,
                    visibles = layout.visibles,
                    template = templateCell,
                    targetElement = tableElement;
                if (dirty) {
                    angular.forEach(visibles, function(item, i) {
                        if (i < count) {
                            var $scope = getCell(i);
                            if (!$scope.$$phase) {
                                $scope.$digest();
                            }
                        }
                    });
                }
                while (visibles.length < count) {
                    var $scope = getCell(visibles.length);
                    var compiled = $compile(template)($scope, function(cloned) {
                        compiled = cloned;
                    });
                    var $element = angular.element(compiled);
                    var nativeElement = $element[0];
                    nativeElement.style.width = '100%';
                    nativeElement.style.height = layout.cell.height + 'px';
                    targetElement.append($element);
                    visibles.push({
                        element: $element,
                        scope: $scope,
                    });
                }
            }
            */

            function drawCells() {
                // console.log('drawCells');
                var count = layout.rows.count * layout.cols.count,
                    visibles = layout.visibles,
                    template = templateCell,
                    targetElement = tableElement;
                if (layout.rows.dirty || layout.cols.dirty) {
                    angular.forEach(visibles, function(cell, i) {
                        if (i < count) {
                            var $scope = getCell(i);
                            if (!$scope.$$phase) {
                                $scope.$digest();
                            }
                            /*
                            var r = Math.floor(i / layout.cols.count);
                            var c = (i % layout.cols.count);
                            var $row = layout.rows.from + r;
                            var $col = layout.cols.from + c;
                            var $index = $row * layout.cols.total + $col;
                            cell.scope.$index = $index;
                            cell.scope.$row = $row;
                            cell.scope.$col = $col;
                            cell.scope.row = rows[$row];
                            cell.scope.col = cols[$col];
                            if (!cell.scope.$$phase) {
                                cell.scope.$digest();
                            }
                            */
                        }
                    });
                    // console.log('dirty', Math.min(visibles.length, count));
                }
                /*
                if (visibles.length < count) {
                    console.log('compile');
                }
                */
                while (visibles.length < count) {
                    var $scope = getCell(visibles.length);
                    /*
                    var i = visibles.length;
                    var r = Math.floor(i / layout.cols.count);
                    var c = (i % layout.cols.count);
                    var $row = layout.rows.from + r;
                    var $col = layout.cols.from + c;
                    var $index = $row * layout.cols.total + $col;
                    var $scope = scope.$new();
                    $scope.$index = $index;
                    $scope.$row = $row;
                    $scope.$col = $col;
                    $scope.row = rows[$row];
                    $scope.col = cols[$col];
                    */
                    /*
                    var $element = angular.element(template);
                    $compile($element)($scope);
                    */
                    /*
                    var compiled = $interpolate(template, false, null, true)($scope);
                    */
                    /**** COMPILE ****/
                    var compiled = $compile(template)($scope, function(cloned) {
                        compiled = cloned;
                        // console.log(cloned[0].outerHTML);
                    });
                    /**** COMPILE ****/
                    var $element = angular.element(compiled);
                    targetElement.append($element);
                    visibles.push({
                        element: $element,
                        scope: $scope,
                    });
                }
            }

            function getCell(i) {
                var r = Math.floor(i / layout.cols.count);
                var c = (i % layout.cols.count);
                var $row = layout.rows.from + r;
                var $col = layout.cols.from + c;
                var $index = $row * layout.cols.total + $col;
                var $scope = layout.visibles.length > i ? layout.visibles[i].scope : scope.$new();
                $scope.$i = i;
                $scope.$r = r;
                $scope.$c = c;
                $scope.$index = $index;
                $scope.$row = $row;
                $scope.$col = $col;
                $scope.row = rows ? rows[$row] : null;
                $scope.col = cols ? cols[$col] : null;
                return $scope;
            }

            // var updating;
            function update() {
                // console.log('update');
                // if (!updating) {
                    // updating = true;
                    updateRows();
                    updateCols();
                    drawCells();
                    /*
                    if (layout.rows.has && layout.cols.has) {
                        drawCells();
                    } else if (layout.rows.has) {
                        drawRows();
                    } else if (layout.cols.has) {
                        drawCols();
                    }
                    */
                    /*
                    if (layout.rows.count > 1 && layout.cols.has > 1) {
                        if (rows && cols) {
                            drawCells();
                        }
                    } else if (layout.rows.has > 1) {
                        if (rows) {
                            drawRows();
                        }
                    } else if (layout.cols.has > 1) {
                        if (cols) {
                            drawCols();
                        }
                    }
                    */
                    render();
                    redraw();
                    // updating = false;
                    /*
                    setTimeout(function() {            
                        updating = false;
                    });
                    */
                // }
            }

            function render() {
                var count = layout.rows.count * layout.cols.count,
                    visibles = layout.visibles;
                var USE_TRANSFORM = true;
                angular.forEach(visibles, function(cell, i) {
                    var nativeElement = cell.element[0];
                    if (i < count) {
                        nativeElement.style.width = (cols ? layout.cell.width : layout.table.width) + 'px';
                        nativeElement.style.height = (rows ? layout.cell.height : layout.table.height) + 'px';
                        var r = cell.scope.$r;
                        var c = cell.scope.$c;
                        if (USE_TRANSFORM) {
                            transform(nativeElement, 'translateX(' + (c * layout.cell.width) + 'px) translateY(' + (r * layout.cell.height) + 'px)');
                        } else {
                            nativeElement.style.left = (c * layout.cell.width) + 'px';
                            nativeElement.style.top = (r * layout.cell.height) + 'px';
                            nativeElement.style.visibility = 'visible';
                        }
                    } else {
                        if (USE_TRANSFORM) {
                            transform(nativeElement, 'translateX(-1000px) translateY(-1000px)');
                        } else {
                            nativeElement.style.left = '0px';
                            nativeElement.style.top = '0px';
                            nativeElement.style.visibility = 'hidden';
                        }
                    }
                });
            }

            function redraw() {
                // var fragment = document.createDocumentFragment();          
                // var row = document.createElement('div');
                // fragment.appendChild(row);
                // nativeTable.appendChild(fragment);
                layout.table.x = Math.floor(layout.scroll.x / layout.cell.width) * layout.cell.width;
                layout.table.y = Math.floor(layout.scroll.y / layout.cell.height) * layout.cell.height;
                transform(nativeTable, 'translateX(' + layout.table.x + 'px) translateY(' + layout.table.y + 'px)');
                log({
                    scroll: layout.scroll,
                    grid: layout.grid,
                    rows: layout.rows.has ? layout.rows : null,
                    cols: layout.cols.has ? layout.cols : null,
                });
            }

            function transform(node, value) {
                node.style.WebkitTransform =
                    node.style.MozTransform =
                    node.style.OTransform =
                    node.style.MsTransform =
                    node.style.transform =
                    value;
            }

            function onRows() {
                layout.rows.total = 0;
                layout.table.height = 0;
                if (rows) {
                    layout.rows.total = rows.length;
                    layout.table.height = layout.rows.total * layout.cell.height;
                    layout.rows.has = true;
                } else {
                    layout.table.height = layout.grid.height;
                    layout.rows.has = false;
                }
                if (rows && rows.length) {
                    element.addClass('vertical');
                } else {
                    element.removeClass('vertical');
                }
                nativeSpacer.style.height = layout.table.height + 'px';
            }

            function onCols() {
                layout.cols.total = 0;
                layout.table.width = 0;
                if (cols) {
                    layout.cols.total = cols.length;
                    layout.table.width = layout.cols.total * layout.cell.width;
                    layout.cols.has = false;
                } else {
                    layout.table.width = layout.grid.width;
                    layout.cols.has = false;
                }
                if (cols && cols.length) {
                    element.addClass('horizontal');
                } else {
                    element.removeClass('horizontal');
                }
                nativeSpacer.style.width = layout.table.width + 'px';
            }

            function onScroll() {
                if (rows) {
                    layout.rows.total = rows.length;
                    layout.table.height = layout.rows.total * layout.cell.height;
                }
                if (cols) {
                    layout.cols.total = cols.length;
                    layout.table.width = layout.cols.total * layout.cell.width;
                }
                layout.scroll.x = Math.max(0, Math.min((layout.table.width - layout.grid.width), nativeInner.scrollLeft));
                layout.scroll.y = Math.max(0, Math.min((layout.table.height - layout.grid.height), nativeInner.scrollTop));
                // console.log(layout.scroll.x, layout.scroll.y, layout.table.width, layout.grid.width);
                update();
            }

            // resize fires on window resize and on scope update      
            function onResize() {
                layout.grid.width = layout.table.width = nativeInner.offsetWidth;
                layout.grid.height = layout.table.height = nativeInner.offsetHeight;
                update();
            }

            /*
            scope.$watch(function() {
                return nativeInner.offsetWidth;
            }, function(nval, oval) {
                if (nval !== oval) {
                    onResize();
                }
            });
            scope.$watch(function() {
                return nativeInner.offsetHeight;
            }, function(nval, oval) {
                if (nval !== oval) {
                    onResize();
                }
            });
            */

            /*
            if (layout.rows.has) {
                element.addClass('vertical');
            }
            if (layout.cols.has) {
                element.addClass('horizontal');
            }
            */
            /*
            console.log('attributes', attributes);
            attributes.$observe('ngridRows', function(value) {
                console.log('ngridRows', value);
            });
            */
            scope.$watchCollection(attributes.ngridRows, function(value) {
                // console.log('ngrid.$watchCollection.ngridRows');
                rows = value;
                onRows();
                onResize();
            });
            scope.$watch(attributes.ngridCols, function(value) {
                // console.log('ngrid.$watchCollection.ngridCols');
                cols = value;
                onCols();
                onResize();
            });
            scope.$watch(attributes.ngrid, function(value) {
                // console.log('ngrid.$watchCollection.ngrid');
                if (angular.isObject(value)) {
                    // ok but add a schema (keys)
                    angular.extend(layout, value);
                    onResize();
                }
            });
            /*
            if (angular.isObject(scope.options)) {
                layout = angular.extend(scope.options, layout);
            }
            */
            /*
            scope.$watch(function(scope) {
                // watch the 'compile' expression for changes
                return scope.$eval(attrs.compile);
            }, function(value) {
                // when the 'compile' expression changes
                // assign it into the current DOM
                element.html(value);
                // compile the new DOM and link it to the current
                // scope.
                // NOTE: we only compile .childNodes so that
                // we don't get into infinite loop compiling ourselves
                $compile(element.contents())(scope);
            });
            */

            function log(obj) {
                layout.info = JSON.stringify(obj);
                nativeInfo.innerHTML = layout.info;
            }

            var down, move, diff, dragging, sx, sy;

            function onStart(e) {
                down = Utils.getTouch(e);
                sx = nativeInner.scrollLeft;
                sy = nativeInner.scrollTop;
                addDragListeners();
                return false;
            }

            function onMove(e) {
                move = Utils.getTouch(e);
                diff = down.difference(move);
                if (!dragging && diff.power() > 25) {
                    dragging = true;
                    element.addClass('dragging');
                }
                if (dragging) {
                    /*
                    style.transform = 'translateX(' + diff.x + 'px) translateY(' + diff.y + 'px)';
                    style.set(target);
                    elementRect.set(nativeElement).offset(diff);
                    */
                    nativeInner.scrollLeft = sx - diff.x;
                    nativeInner.scrollTop = sy - diff.y;
                    onScroll();
                }
                return false;
            }

            function onEnd(e) {
                if (dragging) {
                    dragging = false;
                    element.removeClass('dragging');
                    /*
                    style.transform = 'none';
                    style.set(target);
                    */
                }
                removeDragListeners();
                return false;
            }

            function addDragListeners() {
                angular.element($window).on('touchmove mousemove', onMove);
                angular.element($window).on('touchend mouseup', onEnd);
            };

            function removeDragListeners() {
                angular.element($window).off('touchmove mousemove', onMove);
                angular.element($window).off('touchend mouseup', onEnd);
            };

            function addListeners() {
                angular.element(nativeInner).on('touchstart mousedown', onStart);
                angular.element(nativeInner).on('scroll', onScroll);
                angular.element($window).on('resize', onResize);
            };

            function removeListeners() {
                angular.element(nativeInner).off('touchstart mousedown', onStart);
                angular.element(nativeInner).off('scroll', onScroll);
                angular.element($window).off('resize', onResize);
            };
            scope.$on('$destroy', function() {
                removeListeners();
                removeDragListeners();
            });
            addListeners();
        }
    }
}]);