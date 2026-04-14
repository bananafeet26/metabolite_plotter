function metaboliteApp() {
    return {
        settings: {
            dose: 200,
            doseFrequency: 7,
            startDate: new Date(),
            startDateField: new Date().toLocaleDateString('en-GB'),
            durationWeeks: 6,
            age: 'young',
            nmolNgDl: 'ng',
            halflife: [7.19, 6.9, 1.0375, 21.3, 33.9], // t1/2 days
            cmax: [11.3095, 5.56, 26, 11.7387, 1.187], //ng/dL per mg
            tmax: [1.3875, 4.5, 1.0625, 1.5125, 10], // days
            bioavailability: [0.72, 0.7, 0.84, 0.65,0.65], // percentage
            AUC: [2588], //https://academic.oup.com/view-large/389646248
            esterIndex: 0,
            esterList: ['testosterone enanthate', 'testosterone cypionate', 'testosterone propionate', 'testosterone decanoate','testosterone undecanoate (castor)'],
            sources: ['https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4721027/', 'https://tau.amegroups.org/article/view/11328/13164', 'https://academic.oup.com/jcem/article-abstract/63/6/1361/2674622?redirectedFrom=fulltext&login=false', 'https://www.sciencedirect.com/science/article/abs/pii/S0010782402003906', 'https://onlinelibrary.wiley.com/doi/full/10.2164/jandrol.109.009597' ]
        },
        chart: null,  // Store the Chart.js instance here
        initializeChart() {
            const ctx = document.getElementById('myChart').getContext('2d');
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
                    datasets: [{
                        label: 'E2',
                        data: [10, 20, 30, 40, 50],  // Initial data
                        borderColor: 'pink',
                        fill: false
                    }, {
                        label: 'DHT',
                        data: [10, 20, 30, 40, 50],  // Initial data
                        borderColor: 'blue',
                        fill: false
                    }, {
                        label: 'Total Testosterone',
                        data: [10, 20, 30, 40, 50],  // Initial data
                        borderColor: 'red',
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            type: 'time',  // Use timescale
                            time: {
                                unit: 'day',  // Display unit is 'day'
                                displayFormats: {
                                    day: 'DD/MM',
                                },
                                tooltipFormat: 'll',  // Format for tooltips (optional)
                            },
                            title: {
                                display: true,
                                text: 'Date'
                            },
                            ticks: {
                                maxRotation: 0,  // Optional: Prevent the labels from rotating too much
                                autoSkip: true,  // Automatically skip labels if they are too crowded
                                maxTicksLimit: 10,  // Limit the number of ticks to show on the X-axis
                            }
                        },
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        },
        updateChart() {
            // Calculate testosterone concentration with hysteresis
            function calculateTestosteroneConcentration(dose, doseFrequency, startDate, durationWeeks, age, nmolNgDl, halflife, cmax, tmax, bioavailability, AUC) {
                // Elimination rate constant
                console.log(`Dose: ${dose}, doseFrequency: ${doseFrequency}, startDate: ${startDate}, durationWeeks: ${durationWeeks}, age: ${age}, nmolNgDl: ${nmolNgDl}, halflife: ${halflife}, cmax: ${cmax}, tmax: ${tmax}, bioavailability: ${bioavailability}, AUC: ${AUC}`)
                const ke = Math.LN2 / halflife;
                const days = durationWeeks * 7;

                // Solve absorption rate constant (ka) from tmax via Newton's method
                // tmax = ln(ka/ke) / (ka - ke)  →  solve for ka
                let ka = 3 * ke;
                for (let i = 0; i < 200; i++) {
                    if (ka <= ke) ka = ke * 1.001;
                    const diff = ka - ke;
                    const logRatio = Math.log(ka / ke);
                    const f = logRatio / diff - tmax;
                    const df = (1 / ka * diff - logRatio) / (diff * diff);
                    ka -= f / df;
                    if (Math.abs(f / df) < 1e-14) break;
                }
                if (ka <= ke || !isFinite(ka)) ka = ke * 2;
                console.log(`ke: ${ke}, ka: ${ka}`);
                // Scale factor: make the unscaled Bateman peak equal to cmax * dose * bioavailability
                const peakTime = Math.log(ka / ke) / (ka - ke);
                const peakVal = Math.exp(-ke * peakTime) - Math.exp(-ka * peakTime);
                const S = (cmax * dose * bioavailability) / peakVal * 0.45;
                console.log(`s = ${S}`);

                // Single-dose Bateman function: concentration at time t after one injection at t=0
                function singleDose(t) {
                    if (t <= 0) return 0;
                    return S * (Math.exp(-ke * t) - Math.exp(-ka * t));
                }

                // Michaelis-Menten conversion (Lakshman et al. 2010)
                // E2 (pg/mL) = A_e2 * T / (Km_e2 + T) where T is in ng/dL
                // DHT (ng/dL) = A_dht * T / (Km_dht + T)

                // Constants for YOUNG MEN (ages 19-35)
                let A_e2 = 100.7;  // Max E2 capacity
                let Km_e2 = 1981.0; // T concentration at half-max E2 conversion

                let A_dht = 161.2;  // Max DHT capacity
                let Km_dht = 1109.2; // T concentration at half-max DHT conversion

                // Constants for OLD MEN (ages 36-60)
                if (age === 'old') {
                    A_e2 = 138.3;  // Max E2 capacity
                    Km_e2 = 1470.1; // T concentration at half-max E2 conversion
                    A_dht = 269.4;  // Max DHT capacity
                    Km_dht = 2389.6; // T concentration at half-max DHT conversion
                }

                // Build array of injection times
                const injections = [];
                for (let d = 0; d < days; d += doseFrequency) {
                    injections.push(d);
                }

                // Calculate concentrations — 6 steps per day (every 4 hours)
                const stepsPerDay = 3;
                const extendedSteps = stepsPerDay * (halflife * 5); // run till blood concentration is zero
                const totalSteps = (days * stepsPerDay) + extendedSteps;
                const concentrations = [];
                let stepDate = new Date(startDate);
                let totalAUC = 0; // Initialize AUC variable

                for (let step = 0; step <= totalSteps; step++) {
                    const t = step / stepsPerDay;
                    stepDate.setTime(stepDate.getTime() + (4 * 60 * 60 * 1000)) // Add 4 hours
                    // Superposition: sum contribution from every past injection
                    let testosterone = 0;
                    for (const injTime of injections) {
                        testosterone += singleDose(t - injTime);
                    }
                    // Calculate AUC by integrating concentration over time (approximated using trapezoidal rule)
                    if (step > 0) {
                        const prevConcentration = concentrations[step - 1].testosterone;
                        const deltaTime = 4 / 24; // 4 hours, converted to days
                        totalAUC += (prevConcentration + testosterone) * deltaTime / 2; // Trapezoidal rule for AUC
                    }

                    let estradiol = (A_e2 * testosterone) / (Km_e2 + testosterone);
                    let dht = (A_dht * testosterone) / (Km_dht + testosterone);

                    if (nmolNgDl === 'nmol') {
                        testosterone = testosterone * 0.0347;
                        estradiol = estradiol * 3.67;
                        dht = dht * 0.0347;
                    }
                    concentrations.push({
                        day: new Date(stepDate.getTime()),
                        testosterone: testosterone,  // ng/dL
                        estradiol: estradiol,         // pg/mL
                        dht: dht,                      // ng/dL
                        AUC: totalAUC // Running total of AUC
                    });
                    //console.log(`Date: ${stepDate.toISOString()}, Testosterone: ${testosterone.toFixed(2)}, Estradiol: ${estradiol.toFixed(2)}, DHT: ${dht.toFixed(2)}, AUC: ${totalAUC.toFixed(2)}`);
                }
                let targetAUC = AUC * dose;
                if (nmolNgDl === 'nmol') {
                    targetAUC = AUC * 0.0347 * dose;
                }
                let doseAdjustedAUC = totalAUC;
                // Adjust simulated AUC by dose to compare with known AUC
                let difference = Math.abs(doseAdjustedAUC - targetAUC);  // Calculate the difference
                console.log(`Total AUC: ${doseAdjustedAUC.toFixed(2)} ng/dL·h/L`);
                console.log(`Target AUC: ${targetAUC} ng/dL·h/L`);
                console.log(`Difference: ${difference.toFixed(2)} ng/dL·h/L`);

                return concentrations;
            }

            // Update the chart when the dose or other settings change
            const esterIndex = this.settings.esterIndex;
            const {
                dose,
                doseFrequency,
                startDate,
                durationWeeks,
                age,
                nmolNgDl,
                halflife,
                cmax,
                tmax,
                bioavailability,
                AUC
            } = this.settings;

            // Calculate Total Testosterone for each day
            const concentrations = calculateTestosteroneConcentration(dose, doseFrequency, startDate, durationWeeks, age, nmolNgDl, halflife[esterIndex], cmax[esterIndex], tmax[esterIndex], bioavailability[esterIndex], AUC[esterIndex]);
            this.chart.data.datasets[0].data = [];
            this.chart.data.datasets[1].data = [];
            this.chart.data.datasets[2].data = [];
            this.chart.data.labels = [];
            for (let c in concentrations) {
                this.chart.data.datasets[0].data.push(concentrations[c].estradiol)
                this.chart.data.datasets[1].data.push(concentrations[c].dht)
                this.chart.data.datasets[2].data.push(concentrations[c].testosterone);
                this.chart.data.labels.push(new Date(concentrations[c].day));

            }
            if (nmolNgDl === 'ng') {
                this.chart.data.datasets[0].label = 'E2 (pg/mL)';
                this.chart.data.datasets[1].label = 'DHT (ng/dL)';
                this.chart.data.datasets[2].label = 'TT (ng/dL)';
            } else {
                this.chart.data.datasets[0].label = 'E2 (pmol/L)';
                this.chart.data.datasets[1].label = 'DHT (nmol/L)';
                this.chart.data.datasets[2].label = 'TT (nmol/L)';
            }
            //console.log(this.chart.data.datasets[0].data);
            //console.log(this.chart.data.labels);
            // Update chart data
            this.chart.update();  // Redraw the chart
        },
        esterListComponent() {
            return this.settings;
        },
        updateDuration() {
            this.settings.startDate = new Date(this.settings.startDateField);
            this.updateChart(); // Update chart when duration changes
        }
    }
}
