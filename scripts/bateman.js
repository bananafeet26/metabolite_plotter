function calculateTestosteroneConcentrationBateman(dose, doseFrequency, startDate, durationWeeks, age, nmolNgDl, halflife, cmax, tmax, bioavailability, AUC) {
    // Elimination rate constant
    console.log(`Dose: ${dose}, doseFrequency: ${doseFrequency}, startDate: ${startDate}, durationWeeks: ${durationWeeks}, age: ${age}, nmolNgDl: ${nmolNgDl}, halflife: ${halflife}, cmax: ${cmax}, tmax: ${tmax}, bioavailability: ${bioavailability}, AUC: ${AUC}`)
    const ke = Math.LN2 / halflife;
    const days = durationWeeks * 7;

    // Solve absorption rate constant (ka) from tmax via Newton's method
    // tmax = ln(ka/ke) / (ka - ke)  →  solve for ka
    let ka = 1.5 * ke;
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

function calculateDHTE2 (age, totalTestosterone, nmolNgDl) {
    if (nmolNgDl === 'nmol') {
        totalTestosterone = convert_concentration_units(totalTestosterone, 'nmol/L', 'ng/dL', active_form_data.test.molecular_weight);
    }
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
    let estradiol = (A_e2 * totalTestosterone) / (Km_e2 + totalTestosterone);
    let dht = (A_dht * totalTestosterone) / (Km_dht + totalTestosterone);
    return [estradiol, dht];
}