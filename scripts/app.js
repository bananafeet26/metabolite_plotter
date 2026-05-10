function compoundApp() {
    return {
        settings: {
            totalVolume: 100, // ml
            compounds: [],
            remainingVolume: 100,
            targetConcentrations: [250],
            totalGrams: 0,
            addRowSelectedCompoundId: 0,
            viscosity: 0,
            viscosityRating: 0,
            solventPercentage: 0,
            solventPercentageRating: 0,
            stability: 0,
            isSmall: true,
            selectedRecipeId: 0,
            theme: localStorage.getItem('theme') || 'light',
            selectedPalette: localStorage.getItem('selectedPalette') || 'nature',
        },
        solutionData: {
            viscosity: 0
        },
        solutionMeasurements: [],
        init() {
            const ctx = document.getElementById('myChart').getContext('2d');
            this.chart = new Chart(ctx, chartSettings);

            // Initiate basic recipe
            this.settings.compounds[0] = prepareCompound(1, this.settings.totalVolume, 0, 0, 0, 2, 100); //BA
            this.settings.compounds[1] = prepareCompound(0, this.settings.totalVolume, 0, 0, 0, 20, 100); //BB
            this.settings.compounds[2] = prepareCompound(2, this.settings.totalVolume, 0, 0, 0, 26, 100);
            this.settings.compounds[3] = prepareCompound(3, this.settings.totalVolume, 0, 0, 0, 26, 100);

            this.settings.compounds[4] = prepareCompound(10, this.settings.totalVolume, 0, 0, 250, 0, 93);
            this.settings.compounds[4].purity = 93;

            for (let compound of this.settings.compounds) {
                if (compound.class === "ingredient") {
                    compound.grams = compound.density * compound.mls;
                }
            }
            this.settings.isSmall = window.innerWidth < 576;
            const update = () => this.settings.isSmall = window.innerWidth < 576;
            window.addEventListener('resize', update);
            this.$watch('settings.theme', value => {
                localStorage.setItem('theme', value);
            });
            this.$watch('settings.selectedPalette', value => {
                localStorage.setItem('selectedPalette', value);
            });

            this.changePalette();
        },
        view: "table",
        theme: localStorage.getItem('theme') || 'light',
        chart: null,  // Store the Chart.js instance here
        changePalette() {
            colours = palettes[this.settings.selectedPalette];
            this.updateChart()
        },
        changeTheme() {
            this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
            this.updateChart();
        },
        calculateRemainingVolume() {
            let mls = 0
            for (let i = 0; i < this.settings.compounds.length; i++) {
                if (typeof this.settings.compounds[i] !== undefined) {
                    if (typeof this.settings.compounds[i].mls !== "undefined") {
                        mls += this.settings.compounds[i].mls;
                    }
                }
            }
            return (this.settings.totalVolume - mls)
        },
        addCompoundRow(type) {
            console.log(this.settings.addRowSelectedCompoundId);
            let solutionId = compounds.findIndex(c => c.self_id === this.settings.addRowSelectedCompoundId)

            let remainingVolume = this.calculateRemainingVolume();
            console.log(`solutionId: ${solutionId}`);
            let mls = 0;
            let grams = 0;
            let v_v_percent = 0;
            let mg_per_ml = 50;
            let purity = 100;
            if (type === "excipient") {
                if (remainingVolume > 0) {
                    mls = remainingVolume;
                } else {
                    mls = 10;
                }
            } else if (type === "ingredient") {
                if (typeof compounds[solutionId].mg_per_ml !== "undefined") {
                    mg_per_ml = compounds[solutionId].mg_per_ml;
                } else {
                    mg_per_ml = 100;
                }
            }
            let solutionEntry = prepareCompound(solutionId, this.settings.totalVolume, mls, grams, mg_per_ml, v_v_percent, purity);
            console.log(`solutionId: ${solutionId} mls: ${solutionEntry.mls} grams: ${solutionEntry.grams} v_v_percent: ${solutionEntry.v_v_percent} mg_per_ml: ${solutionEntry.mg_per_ml} purity: ${solutionEntry.purity}`);
            this.settings.compounds.push(solutionEntry);
            this.updateChart()
        },downloadBatchText() {

            let lines = [];

            // Title
            lines.push('                   BATCH REPORT');
            lines.push('===================================================');
            lines.push('');

            // Compounds
            this.solutionMeasurements[0].compounds.forEach(compound => {



                const percent =
                    compound.basis === 'mg_per_ml'
                        ? Number(compound.purity || 0).toFixed(2)
                        : Number(compound.v_v_percent || 0).toFixed(2);

                let nameLine ='';
                nameLine = `${compound.name}`;
                let nameLineEnding = `(${percent}${
                    compound.basis === 'mg_per_ml'
                        ? ' %'
                        : ' % v.v'
                })`;

                let padding = 45 - nameLine.length - nameLineEnding.length;
                let finalLine = nameLine + ' ' + ('.'.repeat(padding)) + (' '.repeat(5))  + nameLineEnding;

                lines.push(finalLine);

                lines.push(
                    `Weight:       ${
                        Number(compound.v_v_percent || 0).toFixed(2)
                    } gm`
                );

                // Viscosity
                if (compound.basis !== 'mg_per_ml') {

                    lines.push(
                        `Viscosity:    ${
                            compound.viscosityArray?.[0] || 0
                        } cP`
                    );
                }

                // Volume / Displacement
                lines.push(
                    `${
                        compound.basis === 'mg_per_ml'
                            ? 'Displacement:'
                            : 'Volume:      '
                    } ${
                        Number(compound.mls || 0).toFixed(2)
                    } ml`
                );
                lines.push('');
            });

            // Totals
            const totals = calculateBatchTotals(
                this.solutionMeasurements[0].compounds
            );

            lines.push('                   BATCH REPORT');
            lines.push('===================================================');
            lines.push(
                `Total Displacement:       ${totals.mls.toFixed(2)} ml`
            );
            lines.push(
                `Total Weight:             ${totals.grams.toFixed(2)} gm`
            );
            lines.push(
                `Filter Time:              ${this.solutionMeasurements[0].filterTime.toFixed(2)} minutes`
            );
            lines.push(
                `Excipients Avg Viscosity: ${this.solutionMeasurements[0].viscosity.toFixed(2)} cP`
            );

            // Create text blob
            const blob = new Blob(
                [lines.join('\n')],
                {type: 'text/plain'}
            );

            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'batch-report.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        },
        removeCompound(uuid) {
            console.log(`removeCompound: ${uuid}`);
            let index = this.settings.compounds.findIndex(
                c => c.self_id === uuid
            );
            console.log(`index: ${index}`);

            if (index !== -1) {
                this.settings.compounds.splice(index, 1);
            }
            // adjust excipients
            let excipients = this.settings.compounds.filter(c => c.class === "excipient");
            let excipientCount = excipients.length;
            if (excipientCount > 0) {
                let compound = excipients[0];
                updateFields(compound.mls, this.settings, "mls");
            }

        },
        toggleQS(uuid) {
            console.log(`toggleQS: ${uuid}`);
            let index = this.settings.compounds.findIndex(
                c => c.self_id === uuid
            );
            this.settings.compounds[index].qsMode = !this.settings.compounds[index].qsMode;
            console.log(`index: ${index}`);
        },
        anaylseBatch() {
            let solutionCalculatedMeasurements = {
                id: crypto.randomUUID(),
                viscosity: 0,
                filterTime: 0,
                title: "",
                compounds: [],
            }
            solutionCalculatedMeasurements.viscosity = calculateViscosity(this.settings.compounds);
            solutionCalculatedMeasurements.filterTime = calculateFilterTimeDarcy(this.settings.totalVolume, solutionCalculatedMeasurements.viscosity);
            for (let i = 0; i < this.settings.compounds.length; i++) {
                if (this.settings.compounds[i].class === "excipient") {
                    solutionCalculatedMeasurements.title += `${this.settings.compounds[i].name} ${this.settings.compounds[i].mls.toFixed(2)}ml, `;
                }
                let found = compounds.find(c => c.self_id === this.settings.compounds[i].self_id);
                //console.log(found.id);
                let newCompound = compounds.find(c => c.self_id === found.self_id);
                newCompound.mls = this.settings.compounds[i].mls;
                newCompound.v_v_percent = this.settings.compounds[i].v_v_percent;
                newCompound.mg_per_ml = this.settings.compounds[i].mg_per_ml;
                newCompound.grams = this.settings.compounds[i].grams;
                newCompound.id = crypto.randomUUID();
                //console.log(newCompound);
                solutionCalculatedMeasurements.compounds.push(newCompound);
            }
            console.log(this.solutionMeasurements);
            this.solutionMeasurements.push(solutionCalculatedMeasurements);
            //this.updateChart();
        }, deleteBatch(uuid) {
            console.log(`deleteBatch: ${uuid}`);
            let index = this.solutionMeasurements.findIndex(
                c => c.id === uuid
            );
            this.solutionMeasurements.splice(index, 1);
            console.log(`index: ${index}`);
            this.updateChart();
        }, get isSmall() {
            return window.innerWidth < 576;
        },
        get isHuge() {
            return window.innerWidth > 1020;
        }, updateRecipe() {
            /*
            {
                id: crypto.randomUUID(),
                name: "Primo Testo Depot",
                solvents: ["benzyl_alcohol", "benzyl_benzoate"],
                solventPercentages: [2, 30],
                excipients:    ["castor"],
                excipientPercentages: [100],
                compounds: ["testosterone_enanthate"],
                compoundConcentration: [250],
            }
             */
            console.log(`Loading recipe: ${this.settings.selectedRecipeId}`)
            this.settings.compounds = [];
            let recipe = recipes[this.settings.selectedRecipeId];
            for (let i = 0; i < recipe.solvents.length; i++) {
                let solvent = recipe.solvents[i];
                let compoundId = compounds.findIndex(c => c.self_id === solvent);
                console.log(`compoundId: ${compoundId} solvent: ${solvent}`);
                let solventPercentage = recipe.solventPercentages[i];
                console.log(`solvent: ${solvent}, solventPercentage: ${solventPercentage}`);
                //function prepareCompound(id, totalVolume, mls, grams, mgsPerMl, v_v_percent, purity) {
                let solventEntry = prepareCompound(compoundId, this.settings.totalVolume, 0, 0, 0, solventPercentage, 100);
                this.settings.compounds.push(solventEntry);
            }
            for (let i = 0; i < recipe.excipients.length; i++) {
                let excipient = recipe.excipients[i];
                let compoundId = compounds.findIndex(c => c.self_id === excipient);
                console.log(`compoundId: ${compoundId} excipient: ${excipient}`);
                let excipientPercentage = recipe.excipientPercentages[i];
                console.log(`excipient: ${excipient}, excipientPercentage: ${excipientPercentage}`);
                let excipientEntry = prepareCompound(compoundId, this.settings.totalVolume, 0, 0, 0, excipientPercentage, 100);

                this.settings.compounds.push(excipientEntry);
            }
            for (let i = 0; i < recipe.compounds.length; i++) {
                let compound = recipe.compounds[i];
                let compoundId = compounds.findIndex(c => c.self_id === compound);
                console.log(`compoundId: ${compoundId} compound: ${compound}`);
                let compoundConcentration = recipe.compoundConcentration[i];
                console.log(`compound: ${compound}, compoundConcentration: ${compoundConcentration}`);
                let compoundEntry = prepareCompound(compoundId, this.settings.totalVolume, 0, 0, compoundConcentration, 0, 100);
                this.settings.compounds.push(compoundEntry);
            }

            this.updateChart();
        },
        updateChart() {
            //this.fillInMissingValues();
            let remainingVolume = this.calculateRemainingVolume();
            if (remainingVolume > 0) {
                console.log("filling in missing values");
                fillInMissingVolume(this.settings.compounds, this.settings.totalVolume, this.settings)
            }
            /* rating system */
            let viscosityData = calculateViscosity(this.settings.compounds)
            this.settings.viscosity = viscosityData;
            this.settings.viscosityRating = viscosityRating(viscosityData);
            this.settings.solventPercentage = calculateSolventPercentage(this.settings.compounds, this.settings.totalVolume);
            this.settings.solventPercentageRating = calculateSolventRating(this.settings.compounds, this.settings.totalVolume, this.settings.solventPercentage);
            this.settings.stability = calculateStability(this.settings.solventPercentage);

            this.settings.remainingVolume = remainingVolume;
            this.chart.data.datasets = [];
            this.chart.data.labels = [];
            let dataset = {
                label: [],
                data: [],  // Initial data
                backgroundColor: [],
                hidden: false,
                fill: true
            };
            for (let i = 0; i < this.settings.compounds.length; i++) {
                dataset.data.push(this.settings.compounds[i].mls);
                this.chart.data.labels.push(`${this.settings.compounds[i].name}`);
                dataset.backgroundColor.push(colours[i]);
            }
            if (remainingVolume > 0) {
                dataset.label = "Remaining volume"
                this.chart.data.labels.push("Remaining volume");
                dataset.backgroundColor.push("red");
                dataset.data.push(remainingVolume);
            }
            this.chart.data.datasets[0] = dataset;
            //console.log(this.chart.data);
            //console.log(this.settings.compounds);
            this.chart.options.plugins.legend.labels.color = (this.settings.theme === 'dark') ? '#ffffff' : '#000000';
            this.chart.update();
            this.solutionMeasurements = [];
            this.anaylseBatch()
        },
    }
}