(function() {
	// Constants
	var MINUTES_IN_DAY = 24 * 60;

	var m = {
		width: parseInt(d3.select('#visualization').style('width')),
		margin: 25,
		height: 25
	};

	var svg = d3.select('#visualization')
				.append('svg')
				.attr('width', m.width)
				.attr('height', 300);

	// Build x-axis
	var x = d3.scale.linear().range([m.margin * 2, m.width - m.margin]).domain([0, MINUTES_IN_DAY]);
	var xAxis = d3.svg.axis()
					.scale(x)
					.orient('top')
					.tickValues(function() {
						var ticks = [];
						for (var i = 0; i <= MINUTES_IN_DAY; i += 60) {
							ticks.push(i);
						}

						return ticks;
					}).tickFormat(function(value) {
						value = value / 60 % 24 % 12;
						return value == 0 ? 12 : value;
					});

	svg.append('g')
		.attr('class', 'x-axis axis')
		.attr('transform', 'translate(0, 20)')
		.call(xAxis);

	// Load data async
	d3.json('data/processed.json', function(err, raw) {
        draw(process(raw));
    });

    var draw = function(data) {
        glob = data;
		// Update height of svg
		svg.attr('height', m.height * data.days.length + m.margin * 1.5);

		// Draw "y-axis"
		svg.append('g')
			.attr('class', 'y-axis axis')
			.selectAll('text')
				.data(data.days)
				.enter()
				.append('text')
					.attr('class', 'y-axis')
					.attr('x', 0)
					.attr('y', function(d) { return y(d, data.days); })
					.text(function(d) { return moment(+d).format('MMM Do'); });

		// Draw the cell phone usage times
		svg.append('g')
			.attr('class', 'usage')
			.selectAll('line')
				.data(data.usage)
				.enter()
				.append('line')
                    .attr('class', 'line')
                    .attr("x1", function(d) { return xx(x, d.on); })
                    .attr("y1", function(d) { return y(d.day, data.days); })
                    .attr("x2", function(d) { return xx(x, d.off); })
                    .attr("y2", function(d) { return y(d.day, data.days); })
                    .attr('idx', function(d, idx) { return idx; });

        // Draw time sleeping
        svg.append('g')
            .attr('class', 'sleep')
            .selectAll('line')
                .data(data.sleep)
                .enter()
                .append('line')
                    .attr('class', 'line')
                    .attr("x1", function(d) { return xx(x, d.on); })
                    .attr("y1", function(d) { return y(d.day, data.days); })
                    .attr("x2", function(d) { return xx(x, d.off); })
                    .attr("y2", function(d) { return y(d.day, data.days); })
                    .attr('idx', function(d, idx) { return idx; });
	};

	// Utility functions
	var process = function(raw) {
        var usage = split(raw.usage),
            sleep = split(raw.sleep),
            days = {};

        usage.forEach(function(item) {
            days[item.day] = true;
        });

		return {
			usage: usage,
            sleep: sleep,
			days: Object.keys(days)
					.map(function(day) { return +day; })
					.sort(function(a, b) { return b - a; })
		};
	};

    var split = function(items) {
        var result = [];
        
        items.forEach(function(item) {
            var start_day = new Date(item.on).setHours(0, 0, 0, 0),
                end_day = new Date(item.off).setHours(0, 0, 0, 0);

            if (start_day != end_day) {
                result.push({
                    on: item.on,
                    off: end_day - 1,
                    day: start_day
                });

                result.push({
                    on: end_day,
                    off: item.off,
                    day: end_day
                });
            } else {
                item.day = start_day;
                result.push(item);
            }
        });

        return result;
    }

	var y = function(day, days) {
		return days.indexOf(day) * m.height + m.margin * 1.5;
	}

	// Normalized x function to deal with time of day offset
	var xx = function(x, timestamp) {
		var midnight = new Date(timestamp).setHours(0, 0, 0, 0);
		return x((timestamp - midnight) / 1000 / 60);
	}
})();