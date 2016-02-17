$('.view').fa({
	viewPathUrl: '/views/',
	//If set true, then can be used button back, in browser, but in url will be changes
	enableHashUrl: false,
	controllers: {

		MainController:{

			actionIndex:{
				view: 'main',
				execute: function($state, $scope){

					return [$state, $scope];
				}
			}

		},

		BlogController: {

			actionIndex:{
				view: 'blog',
				execute: function($state, $scope){
					return [$state, $scope];
				}
			},

			actionNews:{
				view: 'news',
				execute: function($state, $scope){

					$scope.res = ~~$scope.num1 + ~~$scope.num2;
					
					return [$state, $scope];
				}
			},

			actionPage:{
				view: 'page',
				execute: function($state, $scope){

					return [$state, $scope];
				}
			}

		}

	},

	debug: function(app){
		// console.log(app);
	}
});