//https://www.jqueryscript.net/time-clock/Week-Picker-Bootstrap-4.html
(function ($) {

    $.fn.weekpicker = function () {

        // Variables
        var currentDate = moment(),
            selectedWeek,
            selectedYear

        // Public functions
        this.getWeek = function () {
            return selectedWeek;
        }

        this.getYear = function () {
            return selectedYear;
        }
        this.getCurrentDate = function () {
            getCurrentDate($(this).find("input"));
        }
        this.setCurrentDate = function (date, withTimeLine = true) {
            setCurrentDate($(this).find("input"), moment(date), withTimeLine);
        }
        // Private functions
        function getCurrentDate(element) {
            return element.data("DateTimePicker").date();
        }

        function setCurrentDate(element, selectedDate, withTimeLine = true) {
            //console.log('Set Current Date', selectedDate);
            const result = element.data("DateTimePicker").date(selectedDate);
            setWeekYear(element, selectedDate);
            return result;
        }

        function setWeekYear(element, currentDate, withTimeLine = true) {
            //console.log('Set Week Year', currentDate);
            ThisDate.innerHTML = 'SUN ' + currentDate.day(0).toISOString(true).split('T')[0];
            //----------
            //console.log(currentDate.toISOString(true));
            let SunDay = Cesium.JulianDate.fromIso8601(currentDate.day(0).toISOString(true)); //Cesium
            if (withTimeLine) viewer.clock.currentTime = SunDay;
            //console.log(viewer.clock.currentTime.toString());
            //----------
            var calendarWeek = currentDate.week();
            var year = currentDate.year();
            var month = currentDate.month();

            selectedWeek = calendarWeek;
            if (month == 11 && calendarWeek == 1) {
                year += 1;
            }
            selectedYear = year;

            element.val("Week " + calendarWeek + ", " + year);
        }

        function createButton(direction, siblingElement) {
            var button = $("<div class='mb-0 p-2' style='cursor: pointer; background: white; border-radius:.25rem; height:100%'></div>");

            if (direction == "next") {
                button.addClass("next-" + siblingElement.attr("id"));
                button.addClass("fa fa-chevron-right");
                return $("<div>" + button.get(0).outerHTML + "</div>").insertAfter(siblingElement);
            } else if (direction == "previous") {
                button.addClass("previous-" + siblingElement.attr("id"));
                button.addClass("fa fa-chevron-left");
                return $("<div>" + button.get(0).outerHTML + "</div>").insertBefore(siblingElement);
            }
        }

        function clickListener(direction, element, inputField) {
            return element.click(function () {
                if (direction == "next") {
                    var newDate = getCurrentDate(inputField).add(7, 'days');
                } else if (direction == "previous") {
                    var newDate = getCurrentDate(inputField).subtract(7, 'days');
                }
                setCurrentDate(inputField, newDate);
            });
        }

        return this.each(function () {
            // Append input field to weekpicker
            $(this).append(`<input type='text' class='form-control text-center' style='padding:0px;font-weight:bold; cursor:pointer'>
            <div id="ThisDate" style="background: white; text-align: center; font-size: 12px;">${(new Date()).toISOString().split('T')[0]}`);

            var weekpickerDiv = $(this);
            var inputField = weekpickerDiv.find("input");
            // Append DateTimePicker to weekpicker's input field
            //https://getdatepicker.com/4/Options/
            inputField.datetimepicker({
                calendarWeeks: true,
                format: 'DD.MM.YYYY',
                minDate: new Date(Home.MinDate.toString()),
                maxDate: moment(),
                defaultDate: currentDate,
                showTodayButton: true,
                showClose: true,
            }).on("dp.change", function (e) {
                // $(this) relates to inputField here
                var selectedDate = getCurrentDate($(this));
                setCurrentDate($(this), selectedDate);
            }).on("dp.show", function () {
                var currentSelectedDate = getCurrentDate($(this));
                setCurrentDate($(this), currentSelectedDate);
            }).on("dp.hide", function () {
                var currentSelectedDate = getCurrentDate($(this));
                setCurrentDate($(this), currentSelectedDate);
            });
            // Set initial week & year
            setCurrentDate(inputField, currentDate);

            // Create next & previous buttons
            var nextButton = createButton("next", weekpickerDiv);
            var previousButton = createButton("previous", weekpickerDiv);
            // Add click listeners to buttons
            clickListener("next", nextButton, inputField);
            clickListener("previous", previousButton, inputField);

        });

    }

}(jQuery));
