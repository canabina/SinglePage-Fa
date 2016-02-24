$.fn.fa = function(conf) {

    if (!conf)
        conf = {};
    
    var FaObject = new Fa(conf, this);

    FaObject.route();

    function Fa(conf, viewElementJQueryObject){

        var self = this;

        this.currentActions = {};

        this.viewSelector = "";

        this.currentTemplateName = "";

        this.ready = true;

        this.localReady;

        this.pregMask = {};

        this.ifMasks = {};

        this.globalConter = 0;

        this.globalIfCounter = 0;

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

            if (href)
                var href = href.replace("/", "");
            
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

            if ( templateName != 'application' ){

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

                            console.warn('Template - '+ templateName + '.html is not load');

                        }

                    });

                }

            }else
                result = true;
            

            return result;
        }

        this.ifListener = function(localScope){

            $(document).find(this.viewSelector+' > [fa-if]').each(function(index, el) {
                
                var ifExpression = $(this).attr('fa-if');

                if (ifExpression) {

                    var tempExpression = ifExpression;

                    $.each(localScope, function(indexScope, valScope) {

                        if ( ifExpression.indexOf(indexScope)  >= 0 ){

                            if (valScope){

                                if (isNaN(parseInt(valScope)))
                                    valScope = '"'+valScope+'"';

                            }else
                                valScope = 0;

                            tempExpression = tempExpression.replace(new RegExp(indexScope.trim(),'g'), valScope );

                        }

                    });

                    if (!new Function('return ('+tempExpression.trim()+')')()){

                        var attrIndex = $(this).attr('fa-if-index');

                        if (!attrIndex){

                            $(this).attr('fa-if-index', self.globalIfCounter);

                            if ($(this).html())
                                self.ifMasks[self.globalIfCounter] = $(this).html();

                        }
                        
                        $(this).addClass('fa-disabled').html("").css('display', 'none');

                        self.globalIfCounter++;

                    }else{

                        if ($(this).hasClass('fa-disabled')) {

                            var html = self.ifMasks[$(this).attr('fa-if-index')];

                            if (html)
                                $(this).html(html).removeClass('fa-disabled');

                            $(this).css('display', 'block');

                        }

                    }


                }

            });

            self.updateAttrAndTextModels(localScope, true)

        }

        this.modelListener = function(globalScope, actionFunction, globalState){

            this.pregMask = {};

            $(document).off('change keyup', this.viewSelector+' > [fa-object]');

            $(document).off('click', this.viewSelector+' > [fa-click]');

            var localScope = globalScope;

            var updateScope = {};

            var localState = globalState;

            var $modelsJQueryObjects = $(document).find(this.viewSelector).find('[fa-object]');

            if (this.localReady && $modelsJQueryObjects.length) {

                $.each($modelsJQueryObjects, function(index, val) {

                    localScope[$(this).attr('fa-object')] = $(this).is('input') ? $(this).val() : $(this).text();

                });

            };

            if (globalScope) {

                $.each(globalScope, function(index, val) {

                    updateScope[index] = val;

                });

            }

            if (this.localReady)
                localScope = this.updateInModelScope($modelsJQueryObjects, updateScope, localScope);

            $(document).on('change keyup', this.viewSelector+' > [fa-object]', function(event) {
                event.preventDefault();
                
                localScope[$(this).attr('fa-object')] = $(this).val();

                var resultAction = actionFunction(localState, localScope);

                localScope = resultAction[1];

                localState = resultAction[0];

                self.updateModel($modelsJQueryObjects, localScope);

                self.ifListener(localScope);

                self.updateAttrAndTextModels(localScope);

                self.stateListener(localState);


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

                    self.ifListener(localScope);

                    self.updateAttrAndTextModels(localScope);

                    self.stateListener(localState);


                }else{
                    console.warn('Function - "'+ executeFunction +'()" is not defined');
                }
                
            });

            

            if (!this.localReady) {

                this.updateAttrAndTextModels(localScope, true);

                this.ifListener(localScope);

            }

            if (this.localReady)
                return [localScope, localState];
        }

        this.stateListener = function(state){

            if (state.redirect) {

                if (conf.enableHashUrl) {

                    window.history.pushState(state.redirect, '', state.redirect);

                    this.route(state.redirect); 

                }else{

                    var currentAction = localStorage.getItem('currentAction');

                    currentAction = JSON.parse(currentAction);

                    if (currentAction.url != state.redirect) {

                        this.route(state.redirect); 

                    }

                }

            }

        }

        this.updateAttrAndTextModels = function(localScope, status){

            if (status) {

                $.each($(this.viewSelector+' > *'), function(index, val) {

                    $.each(this.attributes, function() {

                        if(this.specified) {

                            if (this.value.indexOf("{{")  >= 0) {

                                $(val).addClass('fa-preg'+self.globalConter);

                                var tmpText = this.value;

                                self.pregMask['fa-preg'+self.globalConter] = {

                                    text: tmpText,

                                    attr: this.name

                                };

                                var str = self.attrReplace(this.value, localScope);

                                $(val).attr(this.name, str);

                                self.globalConter++;
                            }

                        }

                    });

                    if ($(this).text().indexOf("{{") >= 0) {

                        $(this).addClass('fa-preg'+self.globalConter);

                        self.pregMask['fa-preg'+self.globalConter] = {

                            text: $(this).text(),

                        };

                        var str = self.attrReplace($(this).text(), localScope);

                        $(val).text(str);

                        self.globalConter++;

                    }

                }); 

            }else{

                if (self.pregMask) {

                    $.each(self.pregMask, function(index, val) {

                        var str = self.attrReplace(val.text, localScope);

                        if (val.attr) {

                            if (val.attr == 'value') {

                                $('.'+index).val(str);

                            }else{

                                $('.'+index).attr(val.attr, str);

                            }

                        }else{

                            $('.'+index).text(str);
                            
                        }
                    });

                };

            }

        }

        this.attrReplace = function(value, localScope){

            var firstPart = self.helpers.explode('{{',  value);

            var str = "";

            $.each(firstPart, function(index, val) {

                 if (val.indexOf("}}") >= 0) {

                    var r = self.helpers.explode('}}', val);

                    if (val.indexOf("+") >= 0 || val.indexOf("-") >= 0 || val.indexOf("/") >= 0 || val.indexOf("*") >= 0) {

                        var mathTmpStr = r[0];

                        for (var index = 0; index < Object.keys(localScope).length; ++index) {

                            var key = Object.keys(localScope)[index],

                                value = localScope[Object.keys(localScope)[index]];

                            if (!value || isNaN(value)) 
                                value = 0;
                            
                            value = parseInt(value);

         
                            if (mathTmpStr.indexOf(key.trim()) >= 0) {

                                mathTmpStr = mathTmpStr.replace(new RegExp(key.trim(),'g'), value);

                            }
                            
                        }
                        if (mathTmpStr) 
                            secondPart = new Function('return '+mathTmpStr)();

                    }else{

                        secondPart = localScope[r[0]] ? localScope[r[0]] : '';
                    }

                    str += secondPart + r[1];

                    secondPart = "";

                 }else{

                    str += val;

                 }
            });


            return str;
        }

        this.updateModel = function(modelsJQueryObjects, updateScope){

            $.each(modelsJQueryObjects, function(indexElement, valElemen) {

                $.each(updateScope, function(indexScope, valScope) {

                     if ($(valElemen).attr('fa-object') == indexScope && $(valElemen).val() != valScope) {

                        $(valElemen).is('input') ? $(valElemen).val(valScope) : $(valElemen).text(valScope);

                     }

                });

            });

        }

        this.updateInModelScope = function(modelsJQueryObjects, updateScope, localScope){

            var localScope = localScope;

            $.each(modelsJQueryObjects, function(indexElement, valElemen) {

                $.each(updateScope, function(indexScope, valScope) {

                     if ($(valElemen).attr('fa-object') == indexScope) {

                        localScope[indexScope] = valScope;

                        $(valElemen).is('input') ? $(valElemen).val(valScope) : $(valElemen).text(valScope);

                     }

                });

            });

            return localScope;
        }

        this.route = function(href){

            if (localStorage.getItem('currentAction') && conf.enableHashUrl) 
                localStorage.setItem('currentAction', false);

            this.localReady = true;

            var globalScope = {};

            var globalState = {};

            this.viewSelector = viewElementJQueryObject.selector;

            this.listenHash(conf.enableHashUrl);

            this.currentActions = this.getCurrentAction(conf.enableHashUrl, href);

            if ( $.isEmptyObject( conf.controllers ) ){

                conf.controllers = {

                    MainController:{

                        actionIndex:{
                            view: 'application',
                            execute: function($state, $object){

                                return [$state, $object];

                            }

                        }

                    },

                }

            }

            if (conf.controllers[this.currentActions.controller]) {   

                if (conf.controllers[this.currentActions.controller][this.currentActions.action]) {

                    var actionObject = conf.controllers[this.currentActions.controller][this.currentActions.action];

                    var viewName = actionObject.view;

                    if (viewName && this.renderView(viewName)) {

                        var listenerResults = this.modelListener(globalScope, actionObject.execute, globalState);

                        var executeResult = actionObject.execute(globalState, listenerResults[0]); 

                        this.localReady = false;

                        this.modelListener(executeResult[1], actionObject.execute, globalState);

                        if (conf.debug) 
                            conf.debug(this);

                        this.ready = false;

                        self.stateListener(executeResult[0]);

                    }else{
                        console.warn('Select template in your action');
                    }

                }else{
                    console.warn('Controller - '+this.currentActions.action+' is not defined');
                }
            }else{
                console.warn('Controller - '+this.currentActions.controller+' is not defined');
            }
            
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

            },

            isExpressionValue: function(tempExpression){

                if (tempExpression.indexOf("<")  >= 0 || 

                    tempExpression.indexOf(">")  >= 0 ||

                    tempExpression.indexOf(">=")  >= 0 ||

                    tempExpression.indexOf("=>")  >= 0 ||

                    tempExpression.indexOf("===")  >= 0 ||

                    tempExpression.indexOf("==")  >= 0 ||

                    tempExpression.indexOf("&&")  >= 0 ||

                    tempExpression.indexOf("||")  >= 0 
                    )
                    return true;
                else
                    return false;
            },

            isInt: function(n){
                return Number(n) === n && n % 1 === 0;
            },

            replace: function(search, replace, subject){

                if(!(replace instanceof Array)){

                    replace=new Array(replace);

                    if(search instanceof Array){

                        while(search.length>replace.length){

                            replace[replace.length]=replace[0];

                        }

                    }

                }

                if(!(search instanceof Array))search=new Array(search);

                while(search.length>replace.length){

                    replace[replace.length]='';

                }

                if(subject instanceof Array){

                    for(k in subject){

                        subject[k]=str_replace(search,replace,subject[k]);

                    }

                    return subject;

                }

                for(var k=0; k<search.length; k++){

                    var i = subject.indexOf(search[k]);

                    while(i>-1){

                        subject = subject.replace(search[k], replace[k]);

                        i = subject.indexOf(search[k],i);

                    }

                }

                return subject;
    
            }
        }

    }

};

function log(str){
    console.log(str);
}
