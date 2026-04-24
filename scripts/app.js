function metaboliteApp() {
    return {
        settings: {
            dose: 200,
            doseFrequency: 7,
            startDate: new Date(),
            startDateField: new Date().toISOString().split('T')[0],
            durationWeeks: 6,
            age: 'young',
            nmolNgDl: 'ngdl',
            //halflife: [7.19, 6.9, 1.0375, 21.3, 33.9], // t1/2 days
            //cmax: [11.3095, 5.56, 26, 11.7387, 1.187], //ng/dL per mg
            //tmax: [1.3875, 4.5, 1.0625, 1.5125, 10], // days
            //bioavailability: [0.72, 0.7, 0.84, 0.65,0.65], // percentage
            //AUC: [2588], //https://academic.oup.com/view-large/389646248
            esterData: ester_data,
            esterKey: 'tc_o',
        },
        theme: localStorage.getItem('theme') || 'light',
        chart: null,  // Store the Chart.js instance here
        initializeChart() {
            const ctx = document.getElementById('myChart').getContext('2d');
            this.chart = new Chart(ctx, chartSettings);
            this.$nextTick(() => {
                const keys = Object.keys(this.settings.esterData);

                if (!this.settings.esterKey && keys.length) {
                    this.settings.esterKey = keys[0];
                }
            });
            document.documentElement.dataset.theme = this.theme;

            this.$watch('theme', (value) => {
                document.documentElement.dataset.theme = value;
                localStorage.setItem('theme', value);
            });
        },
        getChartTheme() {
            return this.theme === 'dark'
                ? {
                    grid: '#333',
                    text: '#e6e6e6',
                    bg: '#1e1e1e',
                    // 🎨 chart fill (dark mode = subtle glow)
                    fill: 'rgba(255,255,255,0.32)'
                }
                : {
                    grid: '#ddd',
                    text: '#333',
                    bg: '#ffffff',

                    // 🎨 chart fill (light mode = soft pastel)
                    fill: 'rgba(78,59,68,0.25)'
                };
        },
        updateChart() {
            // Calculate testosterone concentration with hysteresis
            // To ensure no variability in peak/trough rendering at long time intervals / frequent doses

            if (typeof (this.settings.startDateField) !== "undefined" ) {
                console.log(this.settings.startDateField);
                console.log(this.settings.startDate);
                const [year, month, day] = this.settings.startDateField.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                console.log(`New date:  ${date} ${year} ${month} ${day}`);
                this.settings.startDate = date;
            }
            if (isNaN(this.settings.startDate.getTime())) {
                this.settings.startDate = new Date();
            }
            // Chart settings
            let no_start_animation = true;
            let nmolNgDl = this.settings.nmolNgDl;

            let hours = 0.041666667;
            let draw_point_time;
            let time_interval = this.settings.durationWeeks * 7;
            let multiple_esters = false;
            if (time_interval < 7) draw_point_time = 0.001 * time_interval;
            else if (time_interval <= 10) draw_point_time = 1 / 3 * hours;
            else if (time_interval <= 21) draw_point_time = 2 / 3 * hours;
            else if (time_interval <= 35) draw_point_time = 1 * hours;
            else if (time_interval <= 45) draw_point_time = 0.75 * hours;
            else if (time_interval <= 70) draw_point_time = 2 * hours;
            else if (time_interval <= 90) draw_point_time = 3 * hours;
            else if (time_interval <= 180) draw_point_time = 6 * hours;
            else if (time_interval <= 360) draw_point_time = 12 * hours;
            else draw_point_time = 0.001 * time_interval;


            let ester = this.settings.esterData[this.settings.esterKey];
            let dose = this.settings.dose;
            let multi_dose = true;
            let dose_interval_original = this.settings.doseFrequency / 7;
            let dose_interval_units = 'weeks';
            let dose_limit = (this.settings.durationWeeks * 7) / this.settings.doseFrequency;
            dose_limit = dose_limit.toFixed(0);
            let steady_state = false;

            options.active_form = ester.active_form
            options.molecular_weight = active_form_data[options.active_form].molecular_weight;

            if (!(dose > 0 && dose <= 9999)) {
                dose = 200;
                this.settings.dose = 200;
            }

            if (!(dose_interval_original > 0 && dose_interval_original <= 999)) {
                dose_interval_original = 7;
                this.settings.doseFrequency = 7;
            }
            let dose_interval = dose_interval_original;

            switch (dose_interval_units) {
                case 'hours' :
                    dose_interval /= 24;
                    break;
                case 'weeks' :
                    dose_interval *= 7;
                    break;
                case 'months':
                    dose_interval *= 30;
                    break;
            }

            if (!(dose_limit >= 1 && dose_limit <= 9999)) {
                dose_limit = 100;
            }
            let activeUnit = 'pg/mL';
            if (ester['active_form'] === 'test') {
                if (nmolNgDl === 'nmol') {
                    activeUnit = 'nmol/L';
                } else if (nmolNgDl === 'ngdl') {
                    activeUnit = 'ng/dL';
                }
            } else {
                if (nmolNgDl === 'nmol') {
                    activeUnit = 'pmol/L';
                } else if (nmolNgDl === 'ngdl') {
                    activeUnit = 'pg/mL';
                }
            }

            draw_point_time = 0.5; // override here other wise autistic math breaks.
            let baseline = 0;
            let curve_data = calc_curve(time_interval, draw_point_time, baseline, dose, dose_interval, multi_dose,
                dose_limit, steady_state, ester['model'], ester['params'], this.settings.startDate, activeUnit, active_form_data[ester['active_form']].molecular_weight);

            let esterModelMetaboliteDataset1 = {
                label: 'DHT',
                data: [],  // Initial data
                yAxisID: 'y1',
                xAxisID: 'x',
                borderColor: 'orange',
                hidden: false,
                fill: false
            }
            let esterModelMetaboliteDataset2 = {
                label: 'E2',
                data: [],  // Initial data
                yAxisID: 'y1',
                xAxisID: 'x',
                borderColor: 'pink',
                hidden: false,
                fill: false
            }
            let esterModelDataset = {
                label: 'Test',
                data: [],  // Initial data
                yAxisID: 'y',
                xAxisID: 'x',
                borderColor: this?.getChartTheme?.().line || 'blue',
                backgroundColor: this?.getChartTheme?.().fill || 'rgba(0,0,255,0.15)',
                hidden: false,
                fill: true
            }
            this.chart.data.labels = [];

            for (let i = 0; i < curve_data.length; i++) {
                this.chart.data.labels.push(new Date(curve_data[i].x));

                if (ester['active_form'] === 'test') {
                    // expect ngdl and returns ngdl units....
                    let [E2, DHT] = calculateDHTE2(this.settings.age, curve_data[i].y, nmolNgDl);
                    esterModelMetaboliteDataset1.data[i] = E2;
                    esterModelMetaboliteDataset2.data[i] = DHT;
                } else if ((ester['active_form'] === 'e2')) {
                    esterModelDataset.yAxisID = 'y1'; // only mapping one E2 so show on right y-axis
                }
            }
            let smallUnit = 'pg/mL';
            let largeUnit = 'ng/dL';
            // Labelling logic.
            if (ester['active_form'] === 'test') {
                if (nmolNgDl === 'nmol') {
                    this.chart.options.scales.y.title.text = 'nmol';
                    this.chart.options.scales.y1.title.text = 'pmol';
                    largeUnit = 'nmol';
                    smallUnit = 'pmol';
                } else if (nmolNgDl === 'ngdl') {
                    this.chart.options.scales.y.title.text = 'ng/dL';
                    this.chart.options.scales.y1.title.text = 'pg/mL';

                }
                this.chart.options.scales.y1.grid.drawOnChartArea = false;
            } else {
                // disable ngdl and nmol
                if (nmolNgDl === 'nmol') {
                    this.chart.options.scales.y.title.text = 'nmol';
                    this.chart.options.scales.y1.title.text = 'pmol';
                    largeUnit = 'nmol';
                    smallUnit = 'pmol';
                } else if (nmolNgDl === 'ngdl') {
                    this.chart.options.scales.y.title.text = 'ng/dL';
                    this.chart.options.scales.y1.title.text = 'pg/mL';
                }
                this.chart.options.scales.y.display = false;
                this.chart.options.scales.y1.grid.drawOnChartArea = true;
            }
            if (nmolNgDl === 'nmol') {
                this.chart.options.plugins.tooltip.callbacks.label = this.chart.options.plugins.tooltip.callbacks.label = function(context) {
                    const { dataset, parsed } = context;
                    const value = parsed.y;

                    return `${dataset.label}: ${Math.floor(value)} ${dataset.unit || ''}`;
                };
                this.chart.options.plugins.tooltip.callbacks.label = function(context) {
                    const { dataset, parsed, chart } = context;
                    const value = parsed.y;

                    const axisId = dataset.yAxisID;

                    const axis = chart.options.scales[axisId];
                    const unit = axis?.title?.text || '';

                    return `${dataset.label}: ${Math.floor(value)} ${unit}`;
                };

            }
            this.chart.options.scales.y.ticks.callback = function(value, index, values) {
                return value + ` ${largeUnit}`;
            };
            this.chart.options.scales.y1.ticks.callback = function(value, index, values) {
                return value + ` ${smallUnit}`;
            };
            esterModelDataset.data = curve_data;
            esterModelDataset.label = ester['name'];
            esterModelMetaboliteDataset1.label = `E2`;
            esterModelMetaboliteDataset2.label = `DHT`;

            this.chart.data.datasets =[];
            this.chart.data.datasets.push(esterModelDataset);
            if (ester['active_form'] === 'test') {
                this.chart.data.datasets.push(esterModelMetaboliteDataset1);
                this.chart.data.datasets.push(esterModelMetaboliteDataset2);
            }
            console.log(this.chart.data);
            // Chart settings
            // chart theme
            const t = this.getChartTheme();
            this.chart.options.scales.x.grid.color = t.grid;
            this.chart.options.scales.y.grid.color = t.grid;
            this.chart.options.scales.y1.grid.color = t.grid;

            this.chart.options.scales.x.ticks.color = t.text;
            this.chart.options.scales.y.ticks.color = t.text;
            this.chart.options.scales.y1.ticks.color = t.text;

            this.chart.update();  // Redraw the chart
        },
    }
}
