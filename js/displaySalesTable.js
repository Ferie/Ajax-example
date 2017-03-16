;
(function ($, window, document, undefined) {
    "use strict";

    var pluginName = 'displaySalesTable',
        now = new Date(),
        yesterday = (function(){
            var yesterday = new Date(now.getTime());
            yesterday.setDate(now.getDate() - 1);
            return yesterday;
        })(),
        defaults = {
            startDay: yesterday.getDate(),
            startMonth: yesterday.getMonth(),
            startYear: yesterday.getFullYear(),
            endDay: now.getDate(),
            endMonth: now.getMonth(),
            endYear: now.getFullYear()
        };

    //constructor
    function plugin(element, options) {
        this.elem = element;
        this.$elem = $(element);
        this.options = $.extend({}, defaults, options);
        this.$salesTableBody = $('.salesTableBody');
        this.$pieChart = $('.pieChart');
        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    plugin.prototype = {
        constructor: plugin,
        getSales: function () {
            var pluginThis = this,
                sortedArray = [];

            $.getJSON('js/sales.json', function (sortedArray) {
                /* Sort the JSON by date */
                sortedArray.sort(pluginThis.sortJsonByDate);
                /* Filter the date in the sorted array */
                pluginThis.filterDate(sortedArray);
            });
        },
        /* Function that sort the JSON by date */
        sortJsonByDate: function (date1, date2) {
            return new Date(date1.date).getTime() - new Date(date2.date).getTime();
        },
        filterDate: function (sortedArray) {
            var pluginThis = this,
                startDate = new Date(pluginThis.options.startYear, pluginThis.options.startMonth, pluginThis.options.startDay),
                endDate = new Date(pluginThis.options.endYear, pluginThis.options.endMonth, pluginThis.options.endDay),
                mostSellableItems = {},
                fiveMostSellableItems = [];

            $.each(sortedArray, function(key, value) {
                var dateToCheck = new Date(value.date);
                if (startDate <= dateToCheck && dateToCheck <= endDate) {
                    /* Show the table for only the items sold in the specific interval of time */
                    pluginThis.displayTableRow(value);
                    /* Create an object of objects with the quantity sold for each product code */
                    pluginThis.mostSellableItems(mostSellableItems, value);
                }
            });

            /* Get the 5 most sellable items */
            fiveMostSellableItems = pluginThis.getFiveMostSellableItems(mostSellableItems);

            /* Display a pie-graph with the 5 most sellable items */
            pluginThis.displayGraph(fiveMostSellableItems);
        },
        displayTableRow: function (value) {
            var pluginThis = this,
                view = {
                    product_code: value.product_code,
                    product_name: value.product_name,
                    date: value.date,
                    totalwotax: value.totalwotax,
                    totalwitax: value.totalwitax
                };

            /* Mustache.js template rendering */
            var output = Mustache.render($('#tableRow').html(), view);

            pluginThis.$salesTableBody.append(output);
            /* End Mustache.js template rendering */
        },
        mostSellableItems: function (mostSellableItems, item) {
            if (mostSellableItems.hasOwnProperty('productCode_' + item.product_code)) {
                mostSellableItems['productCode_' + item.product_code].quantity += parseFloat(item.totalwitax);
            } else {
                mostSellableItems['productCode_' + item.product_code] = {
                    productName: item.product_name,
                    productCode: item.product_code,
                    quantity: parseFloat(item.totalwitax)
                };
            }
        },
        getFiveMostSellableItems: function (mostSellableItems) {
            /* transform the object of objects in an array to sort it in an easy way */
            var arrayMostSellableItems = Object.values(mostSellableItems),
                arrayFiveMostSellableItems = [];

            arrayMostSellableItems.sort(function (item1, item2) {
                return parseFloat(item1.quantity) - parseFloat(item2.quantity);
            });

            /* return only the last five elements that are the most sellable items */
            for (var i = (arrayMostSellableItems.length - 5); i < arrayMostSellableItems.length; i++) {
                arrayFiveMostSellableItems.push(arrayMostSellableItems[i]);
                console.log(arrayMostSellableItems[i]);
            }
            return arrayFiveMostSellableItems;
        },
        displayGraph: function (fiveMostSellableItems) {
            var pluginThis = this;

            var series = (function () {
                var array = [];
                $.each(fiveMostSellableItems, function (key, value) {
                    var obj = {
                        values: [value.quantity],
                        text: value.productName,
                        backgroundColor: '#' + Math.floor(Math.random() * 16777215).toString(16)
                    };
                    array.push(obj);
                });
                return array;
            })();

            var myConfig = {
                type: "pie",
                backgroundColor: "#EAEAEA",
                plot: {
                    borderColor: "#D9D9D9",
                    borderWidth: 5,
                    // slice: 90,
                    valueBox: {
                        placement: 'out',
                        text: '%t\n£%v',
                        fontFamily: "Arial, sans-serif"
                    },
                    tooltip: {
                        fontSize: '18',
                        fontFamily: "Arial, sans-serif",
                        padding: "5 10",
                        text: "%npv%"
                    },
                    animation: {
                        effect: 2,
                        method: 5,
                        speed: 800,
                        sequence: 1
                    }
                },
                source: {
                    text: 'gs.statcounter.com',
                    fontColor: "#8e99a9",
                    fontFamily: "Arial, sans-serif"
                },
                title: {
                    fontColor: "#fff",
                    text: '5 most sellable products',
                    align: "center",
                    offsetX: 10,
                    fontFamily: "Arial, sans-serif",
                    fontSize: 25
                },
                subtitle: {
                    offsetX: 10,
                    offsetY: 10,
                    fontColor: "#8e99a9",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "16",
                    text: 'From ' + pluginThis.options.startDay + '/' + (pluginThis.options.startMonth + 1) + '/' + pluginThis.options.startYear + ' to ' + pluginThis.options.endDay + '/' + (pluginThis.options.endMonth + 1) + '/' + pluginThis.options.endYear,
                    align: "center"
                },
                plotarea: {
                    margin: "20"
                },
                series: series
            };

            zingchart.MODULESDIR = "https://cdn.zingchart.com/modules/";
            ZC.LICENSE = ["569d52cefae586f634c54f86dc99e6a9", "ee6b7db5b51705a13dc2339db3edaf6d"];

            zingchart.render({
                id: 'pieChart',
                data: myConfig,
                height: 500,
                width: 725
            });
        },
        init: function () {
            this.getSales();
        }
    };

    $.fn[pluginName] = function (option) {
        return this.each(function () {
            var data = $.data(this, 'ObjPlugin_' + pluginName),
                options = typeof option === 'object' && option;

            if (!data) $.data(this, 'ObjPlugin_' + pluginName, (data = new plugin(this, options)));
            if (typeof option === 'string') data[option]();
        });
    };

    $.fn[pluginName].defaults = defaults;
    $.fn[pluginName].constructor = plugin;

})(jQuery, window, document);