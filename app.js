var conf = {
	
	viewPathUrl: '/views/',
	//If set true, then can be used button back, in browser, but in url will be changes
	enableHashUrl: true,
	controllers: {

		MainController:{

			actionIndex:{
				view: 'main',
				execute: function($state, $object){
					return [$state, $object];
				}
			}

		},

		ExampleController: {

			actionIndex:{
				view: 'all-exmaple',
				execute: function($state, $object){
					return [$state, $object];
				}
			},

			actionFaobject:{
				view: 'fa-object-example',
				execute: function($state, $object){
					return [$state, $object];
				}
			},

			actionFaclick:{
				view: 'fa-click-example',
				execute: function($state, $object){

					if (!$object.display)
						$object.display = 'block';

					$object.toggle = function(){
						$object.display = $object.display == 'block'  ? 'none' : 'block' ;  
					}

					return [$state, $object];

				}
			},
			
			actionFaif:{
				view: 'fa-if-example',
				execute: function($state, $object){

					$object.array = ['first', 'second', 'third', 'fouth'];

					return [$state, $object];
				}
			}

		}

	},

	debug: function(app){
		// console.log(app);
	}

};

$('.view').fa(conf);
