/**
 * Created by baetz on 25.04.2017.
 */
define(["jquery"], function($) {
    

    return function () {
        if (!String.prototype.endsWith) {
            String.prototype.endsWith = function(searchString, position) {
                var subjectString = this.toString();
                if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                    position = subjectString.length;
                }
                position -= searchString.length;
                var lastIndex = subjectString.indexOf(searchString, position);
                return lastIndex !== -1 && lastIndex === position;
            };
        }

        if (!String.prototype.includes) {
            String.prototype.includes = function(search, start) {
                'use strict';
                if (typeof start !== 'number') {
                    start = 0;
                }

                if (start + search.length > this.length) {
                    return false;
                } else {
                    return this.indexOf(search, start) !== -1;
                }
            };
        }

        if (!Array.prototype.includes) {
            Array.prototype.includes = function(searchElement /*, fromIndex*/) {
                'use strict';
                if (this == null) {
                    throw new TypeError('Array.prototype.includes called on null or undefined');
                }

                var O = Object(this);
                var len = parseInt(O.length, 10) || 0;
                if (len === 0) {
                    return false;
                }
                var n = parseInt(arguments[1], 10) || 0;
                var k;
                if (n >= 0) {
                    k = n;
                } else {
                    k = len + n;
                    if (k < 0) {k = 0;}
                }
                var currentElement;
                while (k < len) {
                    currentElement = O[k];
                    if (searchElement === currentElement ||
                        (searchElement !== searchElement && currentElement !== currentElement)) { // NaN !== NaN
                        return true;
                    }
                    k++;
                }
                return false;
            };
        }
    };
});