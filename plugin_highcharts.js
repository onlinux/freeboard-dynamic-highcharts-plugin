(function() {

	//
	// DECLARATIONS
	//
	var HIGHCHARTS_ID = 0;
	var ONE_SECOND_IN_MILIS = 1000;
	var MAX_NUM_SERIES = 3;

	//
	// HELPERS
	//
        
	// Get coordinates of point
	function xy(obj, x, y) {
		return [ obj[x], obj[y] ]
	}
	
        function isNumber(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
	//
	// TIME SERIES CHARTS
	//
	var highchartsLineWidgetSettings = [
			{
				"name" : "timeframe",
				"display_name" : "Timeframe (s)",
				"type" : "text",
				"description" : "Specify the last number of seconds you want to see.",
				"default_value" : 60
			},
			{
				"name" : "blocks",
				"display_name" : "Height (No. Blocks)",
				"type" : "text",
				"default_value" : 4
			},
			{
				"name" : "title",
				"display_name" : "Title",
				"type" : "text"
			},
			{
				"name" : "xaxis",
				"display_name" : "X-Axis",
				"type" : "calculated",
				"default_value" : "{\"title\":{\"text\" : \"Time\"}, \"type\": \"datetime\", \"floor\":0}"
			},
			{
				"name" : "yaxis",
				"display_name" : "Y-Axis",
				"type" : "calculated",
				"default_value" : "{\"title\":{\"text\" : \"Values\"}, \"minorTickInterval\":\"auto\", \"floor\":0}"
			} ];

	for (i = 1; i <= MAX_NUM_SERIES; i++) {
		var dataSource = {
			"name" : "series" + i,
			"display_name" : "Series " + i + " - Datasource",
			"type" : "calculated"
		};

		var xField = {
			"name" : "series" + i + "label",
			"display_name" : "Series " + i + " - Label",
			"type" : "text",
		};

		highchartsLineWidgetSettings.push(dataSource);
		highchartsLineWidgetSettings.push(xField);
	}

	freeboard
			.loadWidgetPlugin({
				"type_name" : "highcharts-timeseries",
				"display_name" : "Time series (Highcharts)",
				"description" : "Time series line chart.",
				"external_scripts" : [
						"http://code.highcharts.com/highcharts.js",
                                                "plugins/thirdparty/plugin_highcharts_theme.js",
						"http://code.highcharts.com/modules/exporting.js"
                                            ],
				"fill_size" : true,
				"settings" : highchartsLineWidgetSettings,
				newInstance : function(settings, newInstanceCallback) {
					newInstanceCallback(new highchartsTimeseriesWidgetPlugin(
							settings));
				}
			});

	var highchartsTimeseriesWidgetPlugin = function(settings) {

		var self = this;
		var currentSettings = settings;

		var thisWidgetId = "highcharts-widget-timeseries-" + HIGHCHARTS_ID++;
		var thisWidgetContainer = $('<div class="highcharts-widget" id="'
				+ thisWidgetId + '"></div>');

		function createWidget() {
                    
                        Highcharts.theme = {
                            global: {useUTC: false}
                        };

                        Highcharts.setOptions(Highcharts.theme);
                        
			// Get widget configurations
			var thisWidgetXAxis = JSON.parse(currentSettings.xaxis);
			var thisWidgetYAxis = JSON.parse(currentSettings.yaxis);
			var thisWidgetTitle = currentSettings.title;
			var thisWidgetSeries = [];

			for (i = 1; i <= MAX_NUM_SERIES; i++) {
				var datasource = currentSettings['series' + i];
				if (datasource) {
                                        var serieno = "series" + i + "label";
                                        var label = currentSettings[serieno];
                                        console.log('label: ', label);
					var newSeries = {
						id : 'series' + i,
						name : label,
						data : [],
						connectNulls : true
					};
					thisWidgetSeries.push(newSeries);
				}
			}

			// Create widget
			thisWidgetContainer
					.css('height', 60 * self.getHeight() - 10 + 'px');
			thisWidgetContainer.css('width', '100%');

			thisWidgetContainer.highcharts({
				chart : {
					type : 'spline',
					animation : Highcharts.svg,
					marginRight : 20
				},
				title : {
					text : thisWidgetTitle
				},
				xAxis : thisWidgetXAxis,
				yAxis : thisWidgetYAxis,
                                
				tooltip : {
					formatter : function() {
						return '<b>'
								+ this.series.name
								+ '</b><br/>'
								+ Highcharts.dateFormat('%Y-%m-%d %H:%M:%S',
										this.x) + '<br/>'
								+ Highcharts.numberFormat(this.y, 1);
					}
				},
				series : thisWidgetSeries
			});
		}

		self.render = function(containerElement) {
			$(containerElement).append(thisWidgetContainer);
			createWidget();
		}

		self.getHeight = function() {
			return currentSettings.blocks;
		}

		self.onSettingsChanged = function(newSettings) {
			currentSettings = newSettings;
			createWidget();
		}

		self.onCalculatedValueChanged = function(settingName, newValue) {
                        console.log(settingName, 'newValue:', newValue);
                        
			var chart = thisWidgetContainer.highcharts();
			var series = chart.get(settingName);
			if (series) {
				var timeframeMS = currentSettings.timeframe*ONE_SECOND_IN_MILIS;
				var seriesno = settingName;
				var len = series.data.length;
				var shift = false;
				
				// Check if it should shift the series
				if (series.data.length > 1) {
                                        
					var first = series.data[0].x;
					//var last = series.data[series.data.length-1].x;
					var last = new Date().getTime();
					// Check if time frame is complete
                                        var diff = last - first;
//                                         console.log('last :', last);
//                                         console.log('first:', first);
//                                         console.log('diff :', diff);
                                        
					if (last-first>timeframeMS) {
						shift = true;
					}
				}
				
				if (isNumber(newValue)) { //check if it is a real number and not text
                                    var x = (new Date()).getTime();
                                    console.log('addPoint:', x,currentSettings[seriesno], Number(newValue));
                                    var plotMqtt = [x, Number(newValue)]; //create the array+ "Y"
                                    series.addPoint ( plotMqtt, true, shift);
                                };
 			}
		}

		self.onDispose = function() {
			return;
		}
	}

}());