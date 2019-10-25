/**
Included files:
./node_modules/jrails/kernel/namespace.js
./node_modules/jrails/kernel/container.js
./node_modules/jrails/kernel/bootstrap.js
./node_modules/jrails/kernel/func.js
./node_modules/jrails/helper/ajax.js
./node_modules/jrails/helper/array.js
./node_modules/jrails/helper/class.js
./node_modules/jrails/helper/func.js
./node_modules/jrails/helper/jquery.js
./node_modules/jrails/helper/php.js
./node_modules/jrails/helper/url.js
./node_modules/jrails/helper/value.js
./node_modules/jrails/event/eventService.js
*/

/**
 * Работа с пространствами имен
 *
 * Можно объявлять, получать пространства.
 * Пространства имен нужны для иерархичного расположения кода.
 * Есть бандл, это самодостаточный модуль, который содержит в себе все неоходимое для своей работы.
 * В бандле могут распологаться хэлперы, сервисы, хранилища, виджеты, драйвера...
 * В плоском списке содержать разные типы классов неудобно,
 * но можно легко выстроить иерархию, например:
 * - user
 *     - service
 *         - authService
 *         - registrationService
 *         - personService
 *     - helper
 *         - loginHelper
 *         - tokenHelper
 *     - store
 *         - identityStore
 *         - personStore
 *     - widget
 *         - avatarWidget
 * - notify
 *     - service
 *         - notifyService
 *     - driver
 *         - sms
 *             - smscDriver
 *             - a1Driver
 *             - beelineDriver
 *         - notify
 *             - pushDriver
 *             - socketDriver
 *             - firebaseDriver
 *
 * `user` и `notify` - это бандлы.
 *
 * notify.driver.sms.beelineDriver - это полное имя класса драйвера для отправки СМС через Beeline
 * 
 * Аналог "use" из PHP:
 *     var ArrayHelper = bundle.helper.array;
 *
 * Получить любой класс можно так:
 *     namespace.get('bundle.helper.url').setUrl('?post=123');
 * Для прозрачности кода, лучше обращаться к классам явно:
 *     bundle.helper.url.setUrl('?post=123');
 * Составные части:
 *     bundle.helper.url - полное имя класса
 *     bundle.helper - пространство имен
 *     setUrl - метод класса
 */

(function() {

    var registry = {
        isDomLoaded: false,
        classList: {},
        onDomLoaded: function (func) {

            var callback = function () {
                var classDefinition = func();
                if(_.isObject(classDefinition) && _.isFunction(classDefinition._onLoad)) {
                    classDefinition._onLoad();
                }
            };

            if(this.isDomLoaded) {
                callback();
            } else {
                document.addEventListener('DOMContentLoaded', callback);
            }
        },
        onWindowLoad: function() {
            registry.isDomLoaded = true;
            //console.log(registry.classList);
        },
        use: function (className) {
            var func = _.get(registry.classList, className);
            if(_.isFunction(func)) {
                func = func();
                _.set(registry.classList, className, func);
            }
            return func;
        },
        define: function (funcOrClassName, func) {
            if(_.isFunction(funcOrClassName)) {
                registry.onDomLoaded(funcOrClassName);
            } else if(_.isString(funcOrClassName) && _.isFunction(func)) {
                registry.onDomLoaded(function() {
                    //var args = [];
                    //var classDefinition = func.apply({}, args);
                    var classDefinition = func();
                    //classList[funcOrClassName] = classDefinition;
                    _.set(window, funcOrClassName, classDefinition);
                    _.set(registry.classList, funcOrClassName, classDefinition);
                });

            }

            //registry.classList[funcOrClassName] = func;
        },
    };

    window.addEventListener('load', registry.onWindowLoad);
    window.use = registry.use;
    window.space = registry.define;

})();

space('bundle.kernel.loader', function() {

    var store = {
        loaded: {},
        aliases: {},
    };

    var helper = {
        isDefined: function (namespaceArray, object) {
            for (var key in namespaceArray) {
                var item = namespaceArray[key];
                if (typeof object[item] === "object") {
                    object = object[item];
                } else if(typeof object[item] === "undefined") {
                    return false;
                }
            }
            return true;
        },
        define: function (namespaceArray, object, value) {
            for (var key in namespaceArray) {
                var item = namespaceArray[key];
                if (typeof object[item] !== "object") {
                    object[item] = {};
                }
                object = object[item];
            }
            object = value;
        },
        forgeNamespaceRecursive: function (namespaceArray, object) {
            for (var key in namespaceArray) {
                var item = namespaceArray[key];
                if (typeof object[item] !== "object") {
                    object[item] = {};
                }
                object = object[item];
            }
            return object;
        },

        /**
         * Получить значение по пути
         * @param namespace
         * @returns {*}
         */
        get: function(namespace) {
            //namespace = this.getAlias(namespace);
            var arr = namespace.split('.');
            return helper.forgeNamespaceRecursive(arr, window);
        },

    };

    return {
        /**
         * Объявлено ли пространство имен
         * @param path путь
         * @param value в каком значении искать
         * @returns {*|boolean}
         */
        isDefined: function(path, value) {
            //path = this.getAlias(path);
            value = value === undefined ? window : value;
            //value = bundle.helper.value.default(value, window);
            var arr = path.split('.');
            return helper.isDefined(arr, value);
        },
        _getAlias: function (className) {
            for(var i in store.aliases) {
                var from = i;
                var to = store.aliases[i];
                var isMatch = className.indexOf(from + '.') === 0;
                if(isMatch) {
                    return {
                        from: from,
                        to: to,
                    };
                }
            }
            return false;
        },

        setAlias: function (from, to) {
            store.aliases[from] = to;
        },

        getAlias: function (className) {
            var alias = this._getAlias(className);
            if(alias) {
                className = alias.to + className.substr(alias.from.length);
            }
            return className;
        },

        requireClasses: function(classesNameSource, callback) {
            for(var k in classesNameSource) {
                var className = classesNameSource[k];
                this.requireClass(className);
            }
        },

        requireClass: function(classNameSource, callback) {
            var className = classNameSource;
            callback = _.defaultTo(callback, function () {});
            if(this.isDefined(className)) {
                callback();
                return className;
            }
            className = this.getAlias(className);
            if(this.isDefined(className)) {
                callback();
                return className;
            }
            var scriptClassArr = className.split('.');
            var scriptUrl = '/' + scriptClassArr.join('/') + '.js';
            if(store.loaded[scriptUrl] === true) {
                callback();
                return className;
            }
            this.requireScript(scriptUrl, callback);
            store.loaded[scriptUrl] = true;
            console.info('Script loaded "' + scriptUrl + '"!');
            return helper.get(classNameSource);
        },

        requireScript: function(url, callback) {
            jQuery.ajax({
                url: url,
                dataType: 'script',
                complete: callback,
                async: true
            });
            //$('body').append('<script src="' + url + '"></script>');
        },

    };

});

space(function() {

    /**
     * Контейнер
     */
    window.container =  {
        /**
         * Создать экземпляр объекта
         *
         * @param className класс
         * @param attributes назначаемые атрибуты
         * @param params параметры конструктора
         * @returns {Object}
         */
        instance: function (className, attributes, params) {
            if(_.isString(className)) {
                className = use(className);
            }
            return bundle.helper.class.create(className, attributes, params);
        },

        /**
         * Объявлен ли класс в контейнере
         *
         * @param className
         * @returns {Boolean}
         */
        has: function (className) {
            return bundle.kernel.loader.isDefined(className, this);
        },

    };

});
space('bundle.kernel.bootstrap', function() {

    /**
     * Ядро приложения
     *
     * Запускается 1 раз при запуске приложения
     */
    return {
        /**
         * Регистрация сервисов в контейнере
         */
        initContainer: function () {
            //container.env = bundle.env.envService;
            //container.log = bundle.log.logService;
        },

        /**
         * Конфигурация приложения
         */
        initConfig: function () {
            /** Конфигурация приложения */
        },

        /**
         * Запуск ядра приложения
         * @param params
         */
        run: function (params) {
            this.initContainer();
            this.initConfig();
            console.info('default kernel launch');

            /** Запуск приложения */
            //app.run();
        }
    };

});
space(function() {

    /**
     * Функция вывода данных в консоль
     */
    window.dump = function(value) {
        console.log(value);
    };
    window.d = window.dump;

});

space('bundle.helper.ajax', function() {

    /**
     * Работа с AJAX-запросами
     */
    return {

        errorCallback: function (jqXHR, exception) {
            var msg = window.bundle.helper.ajax.getErrorMessage(jqXHR, exception);
            container.notify.error('Произошла ошибка запроса!' + "<br/>" + msg);
        },

        /**
         * Подготовка запроса
         *
         * По умолчанию, при ошибке запроса,
         * пользователю будет показано всплывающее уведомление с ошибкой
         *
         * @param request объект запроса
         * @returns {*}
         */
        prepareRequest: function(request) {
            var complete = function () {
                //container.loader.hide();
            };
            if(!bundle.helper.php.is_function(request.error)) {
                request.error = this.errorCallback;
            }
            if(!bundle.helper.php.is_function(request.complete)) {
                request.complete = complete;
            }
            request.dataType = bundle.helper.value.default(request.dataType, 'json');
            return request;
        },

        /**
         * Оправить AJAX-запрос с ограничением частоты вызова
         *
         * Отложенная отправка запроса нужна для предотвращения посылки множества бессмысленных запросв
         * и снижения нагрузки на сервер при промежуточных изменениях.
         * Например, при перемещении ползунка, значения инпутов обновляются очень быстро.
         *
         * @param request объект запроса
         * @param groupName имя группы схожих запросов
         * @param interval интервал времени, регулирующий частоту вызовов
         */
        sendAtInterval: function(request, groupName, interval) {
            if(!_.isInteger(interval)) {
                interval = 1000;
            }
            interval = bundle.helper.value.default(interval, 1000);
            var func = function () {
                return bundle.helper.ajax.send(request);
            };
            bundle.helper.func.callAtInterval(groupName, func, interval);
        },

        /**
         * Оправить AJAX-запрос
         * @param request
         * @returns {*}
         */
        send: function(request) {
            //container.loader.show();

            var cloneRequest = _.clone(request);
            this.prepareRequest(cloneRequest);

            var promiseCallback = function(resolve,reject){
                cloneRequest.success = function(data) {
                    if(_.isFunction(request.success)) {
                        request.success(data);
                    }
                    resolve(data);
                };
                cloneRequest.error = function(data) {
                    if(_.isFunction(request.error)) {
                        request.error(data);
                    }
                    reject(data);
                };
                $.ajax(cloneRequest);
            };

            var promise = new Promise(promiseCallback);
            return promise;
        },

        /**
         * Полученние сообщения об ошибке
         * @param jqXHR
         * @param exception
         * @returns {string}
         */
        getErrorMessage: function(jqXHR, exception) {
            var msg = '';
            if (jqXHR.status === 0) {
                msg = 'Not connect.\n Verify Network.';
            } else if (jqXHR.status == 404) {
                msg = 'Requested page not found. [404]';
            } else if (jqXHR.status == 500) {
                msg = 'Internal Server Error [500].';
            } else if (exception === 'parsererror') {
                msg = 'Requested JSON parse failed.';
            } else if (exception === 'timeout') {
                msg = 'Time out error.';
            } else if (exception === 'abort') {
                msg = 'Ajax request aborted.';
            } else {
                msg = 'Uncaught Error.\n' + jqXHR.responseText;
            }
            return msg;
        },
    };

});
space('bundle.helper.localStorage', function () {

    /**
     * Работа с Local Storage
     */
    return {

        get: function (key, defaultValue) {
            var data = null;
            var dataJson = localStorage.getItem(key);
            if(! _.isEmpty(dataJson)) {
                data = JSON.parse(dataJson);
            }
            data = _.defaultTo(data, defaultValue);
            return data;
        },

        set: function (key, data) {
            var dataJson = JSON.stringify(data);
            localStorage.setItem(key, dataJson);
        },

        remove: function (key) {
            localStorage.removeItem(key);
        },

    };

});

space('bundle.helper.dom', function() {

    /**
     * Работа с DOM
     */
    return {

        appendToBody: function (element) {
            var bodyElement = $('body');
            bodyElement.append($(element));
        },

        bindEventForList: function (elements, eventName) {
            elements.each(function (index, value) {
                bundle.helper.dom.bindEvent(this, eventName);
            });
        },

        bindEventForAttribute: function (jElement, eventName, attributeName) {
            var aName = attributeName.substr(2);
            var handler = function (params) {
                var compiled = bundle.spa.template.compile(jElement.attr(attributeName), params);
                if (aName === 'html') {
                    jElement.html(compiled);
                } else {
                    jElement.attr(aName, compiled);
                }
            };
            container.event.registerHandler(eventName, handler);
        },

        bindEvent: function (element, eventName) {
            var jElement = $(element);
            var attributes = bundle.helper.dom.getAttributes(element);
            $.each(attributes, function(attributeName, value) {
                var isMatch = attributeName.indexOf('m-') === 0;
                if(isMatch) {
                    bundle.helper.dom.bindEventForAttribute(jElement, eventName, attributeName);
                }
            });
        },

        getAttributes: function (element) {
            var attrs = {};
            $.each(element.attributes, function() {
                if(this.specified) {
                    attrs[this.name] = this.value;
                    //console.log(this.name, this.value);
                }
            });
            return attrs;
        },

    };

});

space('bundle.helper.string', function() {

    /**
     * Работа со строками
     */
    return {

        escapeHtml: function (unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        },

        /*unescapeHtml: function (safe) {
            return safe
                .replace("&amp;", /&/g)
                .replace("&lt;", /</g)
                .replace("&gt;", />/g)
                .replace("&quot;", /"/g)
                .replace("&#039;", /'/g);
        },*/

        unescapeHtml: function (safe) {
            return safe.replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'");
        }

    };

});

space('bundle.helper.array', function() {

    /**
     * Работа с массивами и объектами
     */
    return {

        /**
         * Получить уникальные ключи объекта
         * @param keyList
         * @returns {*}
         */
        uniqueFilter: function(keyList) {
            keyList = keyList.filter(function(itm, i, a) {
                return i == a.indexOf(itm);
            });
            return keyList;
        },

        /**
         * Удалить значение из массива
         * @param arr
         * @param value
         * @returns {boolean}
         */
        removeByValue: function(arr, value) {
            var index = arr.indexOf(value);
            if (index >= 0) {
                arr.splice( index, 1 );
                return true;
            }
            return false;
        },

        /**
         * Получить ключи объекта
         * @param object
         * @returns {[]}
         * @deprecated use _.keys
         */
        getKeys: function(object) {
            return _.keys(object);
            /*var keys = [];
            for (var k in object) keys.push(k);
            return keys;*/
        },

        /**
         * Слить объекты
         * @param from
         * @param to
         */
        merge: function(from, to) {
            for(var k in from) {
                to[k] = from[k];
            }
        },
    };

});
space('bundle.helper.class', function() {

    /**
     * Работа с классами
     */
    return {

        /**
         * Выполнить метод в массиве классов поочередно
         *
         * @param classes массив классов
         * @param method имя вызываемого метода
         * @param params параметры вызываемого метода
         */
        callMethodInClasses: function(classes, method, params) {
            var keys = _.keys(classes);
            for(var i in keys) {
                var key = keys[i];
                var controller = classes[key];
                controller[method](params);
            }
        },

        /**
         * Получить методы объекта
         *
         * @param object
         * @returns {[]}
         * @deprecated use _.functions
         */
        getMethods: function(object) {
            var methods = [];
            var keys = _.keys(object);
            for(var key in keys) {
                var item = keys[key];
                if(bundle.helper.php.is_function(object[item])) {
                    methods.push(item);
                }
            }
            return methods;
        },

        /**
         * Получить публичные методы объекта
         *
         * @param object
         * @returns {[]}
         */
        getPublicMethods: function(object) {
            var methods = [];
            var allMethods = _.functions(object);
            for(var key in allMethods) {
                var method = allMethods[key];
                if(method[0] !== '_') {
                    methods.push(method);
                }
            }
            return methods;
        },

        /**
         * Наследование объекта от родительского
         *
         * @param parent объект родитель
         * @param newClass объект потомок
         * @returns {*}
         */
        extends: function (parent, newClass, interfaceClass) {
            var instance = _.clone(parent);
            instance = _.assign(instance, newClass);
            if(interfaceClass !== undefined) {
                this.checkInterface(instance, interfaceClass);
            }
            //bundle.helper.class.setAttributes(instance, newClass);
            //instance.parent = parent;
            return instance;
        },

        /**
         * Проверка принадлежности объекта к интерфейсу.
         *
         * Если проверяемом объекте описаны не все методы из интерфейса,
         * то вызывается исключение.
         *
         * @param object
         * @param interfaceClass
         * @return {boolean}
         * @throws
         */
        checkInterface: function (object, interfaceClass) {
            var difference = this.checkInterfaceDiff(object, interfaceClass);
            if( ! _.isEmpty(difference)) {
                var message = 'Methods "' + difference.join(', ') + '" not found!';
                throw message;
            }
            return true;
        },

        /**
         * Получение списка недостающих методов.
         *
         * Если все методы, описанные в интерфейсе присутствуют,
         * то возвращается пустой массив.
         *
         * @param object проверяемый объект
         * @param interfaceClass интерфейс
         * @return {Array}
         */
        checkInterfaceDiff: function (object, interfaceClass) {
            if( ! _.isObject(object)) {
                throw 'Source class is not object!';
            }
            if( ! _.isObject(interfaceClass)) {
                throw 'Interface is not object!';
            }
            var methodNames = _.functions(interfaceClass);
            var difference = _.difference(methodNames, _.functions(object));
            return difference;
        },

        /**
         * Проверка принадлежности объекта к интерфейсу
         *
         * @param object проверяемый объект
         * @param interfaceClass интерфейс
         * @returns {boolean}
         */
        isInstanceOf: function (object, interfaceClass) {
            var difference = this.checkInterfaceDiff(object, interfaceClass);
            return _.isEmpty(difference);
        },

        /**
         * Создать новый экземляр объекта
         *
         * @param className класс
         * @param attributes назначаемые атрибуты
         * @param params параметры, передаваемые конструктору объекта
         * @returns {*}
         */
        create: function (className, attributes, params) {
            var instance = _.clone(className);
            instance = _.assign(instance, attributes);
            //bundle.helper.class.setAttributes(instance, attributes);
            this.callConstructor(instance, params);
            return instance;
        },

        /**
         * Создать новый экземляр объекта
         *
         * @param className класс
         * @param params параметры, передаваемые конструктору объекта
         * @returns {*}
         */
        createInstance: function(className, params) {
            var instance = _.clone(className);
            this.callConstructor(instance, params);
            return instance;
        },

        /**
         * Клонировать объект
         *
         * @param className
         * @returns {*}
         */
        /*clone: function(className) {
            return _.clone(className);
        },*/

        /**
         * Присвоить объекту атрибуты
         *
         * @param instance
         * @param attributes
         */
        setAttributes: function(instance, attributes) {
            return  _.assign(instance, attributes);
            /*if (typeof attributes === 'object') {
                for (var k in attributes) {
                    instance[k] = attributes[k];
                }
            }*/
        },

        /**
         * Вызвать метод конструктора объекта
         *
         * @param instance
         * @param params
         */
        callConstructor: function(instance, params) {
            if(bundle.helper.php.method_exists(instance, '__construct')) {
                instance.__construct(params);
            }
        },
    };

});
space('bundle.helper.func', function() {

    var callAtIntervalHelper = {

        _lastTime: {},
        _timeoutId: {},

        refreshTimeout: function(name) {
            this._lastTime[name] = bundle.helper.value.nowTimestamp();
        },

        issetTimeout: function(name) {
            return ! _.isEmpty(this._lastTime[name]);
        },

        refreshCall: function(name, func, interval) {
            clearTimeout(this._timeoutId[name]);
            this._timeoutId[name] = setTimeout(func,interval);
        },

    };

    /**
     * Работа с функциями
     */
    return {

        /**
         * Вызвать метод не чаще, чем указано в интервале.
         *
         * Если интервал указан 1000, то метод будет вызван не чаще,
         * чем 1 раз в 1 секунду.
         * Если метод вызван 2 раза за секунду, то выполнится последний метод,
         * предыдущие методы удалятся
         *
         * @param name имя
         * @param func вызываемая функция
         * @param interval интервал в милисекундах
         * @returns {*}
         */
        callAtInterval: function(name, func, interval) {
            if(! callAtIntervalHelper.issetTimeout(name)) {
                callAtIntervalHelper.refreshCall(name, func, interval);
                callAtIntervalHelper.refreshTimeout(name);
                return false;
            }
            callAtIntervalHelper.refreshTimeout(name);
        },
    };

});
space('bundle.helper.jqueryUi', function() {

    /**
     * Работа с JQuery
     */
    window.bundle.helper.jquery = {

    };

    /**
     * Работа с JQuery UI
     */
    return {

        eventTrigger: function (widget, eventType, data) {
            var names = this.getElementEventNames(widget, eventType);
            names.forEach(function(item) {
                container.event.trigger(item, data);
            });
        },

        getElementEventNames: function (widget, eventType) {
            var elementId = widget.element.attr('id');
            var names = [];
            if(!bundle.helper.php.empty(elementId)) {
                names.push(widget.widgetEventPrefix+'.'+elementId+'.'+eventType);
            }
            names.push(widget.widgetEventPrefix+'.'+eventType);
            return names;
        },

    };

});
space('bundle.helper.php', function() {

    /**
     * Аналоги функций из PHP SPL
     */
    return {

        /**
         * Является ли целым числом
         * @param data
         */
        is_int: function (data) {
            return data === parseInt(data, 10);
        },

        /**
         * содержится ли ключ в объекте
         * @param key
         * @param array
         * @returns {number}
         */
        in_array: function (key, array) {
            return $.inArray(key, array) !== -1 ? 1 : 0;
        },

        /**
         * Получить тип данных
         * @param value
         * @returns {string}
         */
        get_type: function (value) {
            var type = null;
            if(this.is_function(value)) {
                return 'function';
            }
            if(this.is_object(value)) {
                return 'object';
            }
            if(this.is_array(value)) {
                return 'array';
            }
        },

        /**
         * Является ли функцией или методом
         * @param value
         * @returns {boolean}
         */
        is_function: function (value) {
            return typeof value === "function";
        },

        /**
         * Является ли объектом
         * @param value
         * @returns {boolean}
         */
        is_object: function (value) {
            if (value instanceof Array) {
                return false;
            } else {
                return (value !== null) && (typeof(value) === 'object');
            }
        },

        /**
         * Назначено ли значение
         * @param value
         * @returns {boolean}
         */
        isset: function (value) {
            //return element.length > 0;
            return typeof(value) !== "undefined" && value !== null;
        },

        /**
         * Является ли пустым
         * @param value
         * @returns {boolean|*}
         */
        empty: function (value) {
            if(typeof value === "undefined") {
                return true;
            }
            return (value === "" || value === 0 || value === "0" || value === null || value === false || (this.is_array(value) && value.length === 0));
        },

        /**
         * Является ли массивом
         * @param value
         * @returns {boolean}
         */
        is_array: function (value) {
            return (value instanceof Array);
        },

        /**
         * Существует ли метод в объекте
         * @param object
         * @param method
         * @returns {boolean}
         */
        method_exists: function (object, method) {
            return typeof object[method] === 'function';
        },
    };

});
space('bundle.helper.url', function() {

    /**
     * Работа с ссылками
     */
    return {

        /**
         * Изменить URL страницы без перезагрузки
         * @param url относительный URL
         */
        setUrl: function (url) {
            var state = {};
            var title = '';
            history.pushState(state, title, url);
        },
    };

});
space('bundle.helper.value', function() {

    /**
     * Работа с данными
     */
    return {

        /**
         * Получить значение по умолчанию, если значение не назначенное
         * @param value
         * @param defaultValue
         * @returns {*}
         */
        default: function(value, defaultValue) {
            return value === undefined ? defaultValue : value;
        },

        /**
         * Пустое ли значение
         * @param value
         * @returns {boolean}
         */
        isEmpty: function(value) {
            return value !== '' && value !== null && value !== [];
        },

        /**
         * Получить текущее время в виде TIMESTAMP
         * @returns {number}
         */
        nowTimestamp: function() {
            return ( new Date() ).getTime();
        },
        /*createInstance: function(className, params) {
            var instanceArray = FastClone.cloneArray([className]);
            var instance = instanceArray[0];
            this.callConstructor(instance, params);
            return instance;
        },
        setAttributes: function(instance, attributes) {
            if (typeof attributes === 'object') {
                for (var k in attributes) {
                    instance[k] = attributes[k];
                }
            }
        },
        callConstructor: function(instance, params) {
            if(bundle.helper.php.method_exists(instance, '__construct')) {
                instance.__construct(params);
            }
        },*/
    };

});
space('bundle.event.eventService', function() {

    /**
     * Работа с событиями
     */
    return {

        handlers: {},
        holdList: {},

        /**
         * Регистрация обработчика события
         *
         * @param eventName {String|Array} имя события или массив имен
         * @param handler обработчик (функция или класс с методом "run")
         */
        registerHandler: function(eventName, handler) {
            if(_.isArray(eventName)) {
                for(var k in eventName) {
                    var eventNameItem = eventName[k];
                    this.registerHandler(eventNameItem, handler);
                }
            }
            this._initEventArray(eventName);
            this.handlers[eventName].push(handler);
            console.info('Register handler (' + bundle.helper.php.get_type(handler) + ') for event "' + eventName + '"');
        },

        /**
         * Удаление обработчика события
         *
         * @param eventName имя события
         * @param handler обработчик (функция или класс с методом "run")
         */
        removeHandler: function(eventName, handler) {
            this._initEventArray(eventName);
            var isRemoved = bundle.helper.array.removeByValue(this.handlers[eventName], handler);
            if(isRemoved) {
                console.info('Remove handler for event "' + eventName + '"');
            }
        },

        /**
         * Отключить обработку события
         *
         * @param eventName имя события
         */
        hold: function(eventName) {
            this.holdList[eventName] = true;
        },

        /**
         * Включить обработку события
         *
         * @param eventName имя события
         */
        unHold: function(eventName) {
            this.holdList[eventName] = false;
        },

        /**
         * Отключена ли обработка события
         *
         * @param eventName имя события
         * @returns {boolean}
         */
        isHold: function(eventName) {
            return ! _.isEmpty(this.holdList[eventName]);
        },

        /**
         * Вызов события
         *
         * @param eventName имя события
         * @param params параметры события
         */
        trigger: function(eventName, params) {
            if(this.isHold(eventName)) {
                console.info('Event "' + eventName + '" is hold!');
                return;
            }
            this._initEventArray(eventName);
            var handlers = this.handlers[eventName];
            this._runHandlersForEvent(eventName, handlers, params);
        },

        _initEventArray: function(eventName) {
            if(!bundle.helper.php.isset(this.handlers[eventName])) {
                this.handlers[eventName] = [];
            }
        },

        _runHandlersForEvent: function (eventName, handlers, params) {
            if(bundle.helper.php.empty(handlers)) {
                console.info('Not found handlers for event "' + eventName + '"');
                return;
            }

            var self = this;
            handlers.forEach(function(handler) {
                self._runHandler(eventName, handler, params);
            });

            /*for (var key in handlers) {
                var handler = handlers[key];
                this._run(handler, params);
            }*/
        },
        _runHandler: function (eventName, handler, params) {
            if(bundle.helper.php.is_object(handler)) {
                handler.run(params);
                console.info('Run handler (object) for event "' + eventName + '"');
            } else if(bundle.helper.php.is_function(handler)) {
                handler(params);
                console.info('Run handler (function) for event "' + eventName + '"');
            }
        }
    };

});