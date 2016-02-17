$.fn.fa = function(conf) {
    
    var FaObject = new Fa(conf, this);

    FaObject.route();

    function Fa(conf, viewElementJQueryObject){

        var self = this;

        this.currentActions = {};

        this.viewSelector = "";

        this.currentTemplateName = "";

        this.ready = true;

        this.localReady;

        this.listenHash = function(listenHash) {

            $(document).off('click', this.viewSelector+' > [fa-link]');

            if (listenHash) {
                $(document).on('click', this.viewSelector+' > [fa-link]', function(event) {
                    if (!$(this).attr('href')) {
                        event.preventDefault();
                        window.history.pushState('/', '', '/');
                        self.route($(this).attr('href'));
                    }else{
                        window.onhashchange = function(event) {
                            self.route();
                        }
                    }
                });

                
            }else{
                $(document).on('click', this.viewSelector+' > [fa-link]', function(event) {
                    event.preventDefault();
                    self.route($(this).attr('href'));
                });
            }

            
        }

        this.getCurrentAction = function(listenHash, href){

            if ( self.ready && !listenHash && localStorage.getItem('currentAction') ) {

                var routeData = JSON.parse(localStorage.getItem('currentAction'));


            }else{

                var actionObject = JSON.parse(localStorage.getItem('currentAction'));

                if (actionObject && actionObject.url)
                    var lastUrl = actionObject.url;
                
                var h = href ? href : (lastUrl && !listenHash && this.ready) ? JSON.parse(localStorage.getItem('currentAction')).url : window.location.hash;

                var urlData = this.helpers.clearEmptyItemsFromArray(this.helpers.explode('#', h)),
                    routeData = {};

                if ($.isEmptyObject(urlData)) {
                    routeData = {
                        controller: 'MainController',
                        action: 'actionIndex',
                        url: h
                    }
                } else {
                    routeData = {
                        controller: this.helpers.ucfirst(urlData[0]) + 'Controller',
                        action: urlData[1] ? 'action' + this.helpers.ucfirst(urlData[1]) : 'actionIndex',
                        url: h
                    }
                } 

            }


            if (!listenHash) 
                localStorage.setItem('currentAction', JSON.stringify(routeData));

            return routeData;
        }

        this.renderView = function(templateName){
            var result = false;
            if (templateName) {
                $.ajax({
                    url: conf.viewPathUrl + templateName + '.html',
                    type: 'GET',
                    dataType: 'html',
                    async: false,
                    success: function(res) {
                        if (res) {
                            viewElementJQueryObject.html(res);
                            result = true; 
                        }
                    },
                    error: function(){
                        console.log('Template - '+ templateName + '.html is not load');
                    }
                });
            }
            return result;
        }

        this.modelListener = function(globalScope, actionFunction, globalState){

            $(document).off('change keyup', this.viewSelector+' > [fa-model]');

            $(document).off('click', this.viewSelector+' > [fa-click]');

            var localScope = {};

            var updateScope = {};

            var localState = globalState;

            var $modelsJQueryObjects = $(document).find(this.viewSelector).find('[fa-model]');

            if (this.localReady && $modelsJQueryObjects.length) {
                $.each($modelsJQueryObjects, function(index, val) {
                    localScope[$(this).attr('fa-model')] = $(this).is('input') ? $(this).val() : $(this).text();
                });
            };

            if (globalScope) {
                $.each(globalScope, function(index, val) {
                    updateScope[index] = val;
                });
            }

            if (this.localReady)
                localScope = this.updateInModelScope($modelsJQueryObjects, updateScope, localScope);


            $(document).on('change keyup', this.viewSelector+' > [fa-model]', function(event) {
                event.preventDefault();
                
                localScope[$(this).attr('fa-model')] = $(this).val();

                var resultAction = actionFunction(localState, localScope);

                localScope = resultAction[1];

                localState = resultAction[0];

                self.updateModel($modelsJQueryObjects, localScope);
            });

            $(document).on('click', this.viewSelector+' > [fa-click]', function(event) {
                event.preventDefault();
                
                var executeFunction = $(this).attr('fa-click').replace('()', "");

                var resultAction = actionFunction(localState, localScope);

                if (resultAction[1][executeFunction]) {

                    resultAction[1][executeFunction](localState);

                    localScope = resultAction[1];

                    localState = resultAction[0];

                    self.updateModel($modelsJQueryObjects, localScope);
                }else{
                    console.warn('Function - "'+ executeFunction +'()" is not defined');
                }
                
            });
            
            

            if (this.localReady)
                return [localScope, localState];
        }

        this.updateModel = function(modelsJQueryObjects, updateScope){
            $.each(modelsJQueryObjects, function(indexElement, valElemen) {
                $.each(updateScope, function(indexScope, valScope) {
                     if ($(valElemen).attr('fa-model') == indexScope && $(valElemen).val() != valScope) {
                        $(valElemen).is('input') ? $(valElemen).val(valScope) : $(valElemen).text(valScope);
                     }
                });
            });
        }

        this.updateInModelScope = function(modelsJQueryObjects, updateScope, localScope){
            var localScope = localScope;
            $.each(modelsJQueryObjects, function(indexElement, valElemen) {
                $.each(updateScope, function(indexScope, valScope) {
                     if ($(valElemen).attr('fa-model') == indexScope) {
                        localScope[indexScope] = valScope;
                        $(valElemen).is('input') ? $(valElemen).val(valScope) : $(valElemen).text(valScope);
                     }
                });
            });
            return localScope;
        }

        this.route = function(href){

            this.localReady = true;

            var globalScope = {};

            var globalState = {};

            this.viewSelector = viewElementJQueryObject.selector;

            this.listenHash(conf.enableHashUrl);

            this.currentActions = this.getCurrentAction(conf.enableHashUrl, href);

            if (conf.controllers[this.currentActions.controller]) {   
                if (conf.controllers[this.currentActions.controller][this.currentActions.action]) {

                    var actionObject = conf.controllers[this.currentActions.controller][this.currentActions.action];

                    var viewName = actionObject.view;

                    if (viewName && this.renderView(viewName)) {

                        var listenerResults = this.modelListener(globalScope, actionObject.execute, globalState);

                        var executeResult = actionObject.execute(globalState, listenerResults[0]); 

                        this.modelListener(executeResult[1], actionObject.execute, globalState);

                        if (conf.debug) 
                            conf.debug(this);
                        
                        this.localReady = false;

                        this.ready = false;

                    }else{
                        console.warn('Select template in your action');
                    }

                }else{
                    console.warn('Controller - '+this.currentActions.action+' is not defined');
                }
            }else{
                console.warn('Controller - '+this.currentActions.controller+' is not defined');
            }
                    
            // console.log(this);
            
        }

        this.helpers = {
            explode: function( delimiter, string ) {
                var emptyArray = { 0: '' };
                if ( arguments.length != 2|| typeof arguments[0] == 'undefined'|| typeof arguments[1] == 'undefined' )
                    return null;
                if ( delimiter === ''|| delimiter === false|| delimiter === null )
                    return false;
                if ( typeof delimiter == 'function'|| typeof delimiter == 'object'|| typeof string == 'function'|| typeof string == 'object' )
                    return emptyArray;
                if ( delimiter === true ) 
                    delimiter = '1';
                return string.toString().split ( delimiter.toString() );
            },
            clearEmptyItemsFromArray: function(origin){
                var result = [];
                for (var i = 0; i < origin.length; i++) {
                    if ( origin[i] ) {
                        result.push(origin[i]);
                    }
                }
                return result;
            },
            ucfirst: function(str){
                var f = str.charAt(0).toUpperCase();
                return f + str.substr(1, str.length-1);
            }
        }

    }

};