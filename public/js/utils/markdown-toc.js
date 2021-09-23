(function (window) {
    'use strict';

    var extendObj = function (src, target) {
        for (var prop in target) {
            if (target.hasOwnProperty(prop) && target[prop]) {
                src[prop] = target[prop];
            }
        }

        return src;
    };

    var getHeaders = function (selector, scope) {
        var ret = [];
        var target = document.querySelectorAll(scope);

        Array.prototype.forEach.call(target, function (elem) {
            var elems = elem.querySelectorAll(selector);
            ret = ret.concat(Array.prototype.slice.call(elems));
        });

        return ret;
    };

    var getLevel = function (header) {
        if (typeof header !== 'string') {
            return 0;
        }

        var decs = header.match(/\d/g);
        return decs ? Math.min.apply(null, decs) : 1;
    };

    var createList = function (wrapper, count) {
        while (count--) {
            wrapper = wrapper.appendChild(
                document.createElement('ol')
            );

            if (count) {
                wrapper = wrapper.appendChild(
                    document.createElement('li')
                );
            }
        }

        return wrapper;
    };

    var jumpBack = function (currentWrapper, offset) {
        while (offset--) {
            currentWrapper = currentWrapper.parentElement;
        }

        return currentWrapper;
    };

    var setAttrs = function (overwrite, prefix) {
        return function (src, target, index) {
            var content = src.textContent;
            var pre = prefix + '-' + index;
            target.textContent = content;

            var id = overwrite ? pre : (src.id || pre);

            id = encodeURIComponent(id);

            src.id = id;
            target.href = '#' + id;
        };
    };

    var buildTOC = function (options) {
        var selector = options.selector;
        var scope = options.scope;

        var ret = document.createElement('ol');
        var wrapper = ret;
        var lastLi = null;

        var _setAttrs = setAttrs(options.overwrite, options.prefix);

        getHeaders(selector, scope).reduce(function (prev, cur, index) {
            var currentLevel = getLevel(cur.tagName);
            var offset = currentLevel - prev;

            if (offset > 0) {
                wrapper = createList(lastLi, offset);
            }

            if (offset < 0) {
                wrapper = jumpBack(wrapper, -offset * 2);
            }

            wrapper = wrapper || ret;

            var li = document.createElement('li');
            var a = document.createElement('a');

            _setAttrs(cur, a, index);

            wrapper.appendChild(li).appendChild(a);

            lastLi = li;

            return currentLevel;
        }, getLevel(selector));

        return ret;
    };

    var initTOC = function (options) {
        var defaultOpts = {
            selector: 'h1, h2, h3, h4, h5, h6',
            scope: 'body',
            overwrite: false,
            prefix: 'toc'
        };

        options = extendObj(defaultOpts, options);

        var selector = options.selector;

        if (typeof selector !== 'string') {
            throw new TypeError('selector must be a string');
        }

        if (!selector.match(/^(?:h[1-6],?\s*)+$/g)) {
            throw new TypeError('selector must contains only h1-6');
        }

        var currentHash = location.hash;

        if (currentHash) {
            setTimeout(function () {
                var anchor = document.getElementById(currentHash.slice(1));
                if (anchor) anchor.scrollIntoView();
            }, 0);
        }

        return buildTOC(options);
    };

    if (typeof define === 'function' && define.amd) {
        define(function () {
            return initTOC;
        });
    } else {
        window.initTOC = initTOC;
    }
}(window));