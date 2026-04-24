/*** Injectable Estradiol Simulator Advanced by Blahaj Luna and Aly @ Transfeminine Science (transfemscience.org) ***/
/*** Copyright of Transfeminine Science and all rights reserved (please don't reproduce) ***/

// Make curve
function calc_curve(time_interval, draw_point_time, baseline, dose, dose_interval, multi_dose, dose_limit, steady_state, model, params, startDate, nmolNgDl, molecularWeight) {
    console.log(`Calculating curve for ${time_interval} days, ${draw_point_time} days per point, baseline ${baseline}, dose ${dose}, dose interval ${dose_interval}, multi-dose ${multi_dose}, dose limit ${dose_limit}, steady state ${steady_state}, model ${model}, params ${params}, startDate ${startDate.getDate()}, nmolNgDl ${nmolNgDl}, molecularWeight ${molecularWeight}`)

    var dose_transform = dose / params['fit_dose'];
    if (model === 'bateman') {
        dose_transform = dose * params['bioavailability']/params['fit_dose'];
    }
    var curve_data = [];

    var prev_doses = steady_state ? calc_steady_doses(model, params, dose_interval, dose) : 0;

    for (let t = 0; t <= time_interval; t += draw_point_time) {
        let num_doses = 1;
        if (multi_dose) {
            num_doses = 1 + Math.floor(t / dose_interval);
        }

        let C = baseline;
        for (let dose_num = -prev_doses; dose_num < num_doses; dose_num++) {
            var tdose = t - dose_num * dose_interval;
            C += calc_curve_point(tdose, model, params, dose) * dose_transform;
            if (num_doses > dose_limit) {
                num_doses = dose_limit;
            }
        }
        var msToAdd = t * 24 * 60 * 60 * 1000;
        let date = new Date(startDate.getTime() + msToAdd);

        let curve_datum = {
            x: date,
            y: convert_concentration_units(C, 'pg/mL', nmolNgDl, molecularWeight),

        };
        //console.log(`${curve_datum.y} = convert_concentration_units(${C}, 'pg/mL', ${nmolNgDl}, ${molecularWeight})`)
        curve_data.push(curve_datum);
    }

    return curve_data;
}

function calc_steady_doses(model, params, dose_interval, dose) {
    var acceptable_error = 0.0001;
    var maximum_doses = 1000;
    var doses = 0;
    var trough = 0;

    for (var doses = 1; doses < maximum_doses; doses++) {
        var new_trough = trough + calc_curve_point(dose_interval * doses, model, params);
        if ((new_trough - trough) / trough < acceptable_error) break;
        trough = new_trough;
    }

    if (doses == maximum_doses) {
        alert('Steady state not reached by 1000 doses. Graph starts after 1000 doses previous.');
    }

    return doses;
}



// Calculate concentration at time t with different models
function calc_curve_point(t, model, p, dose) {
    switch (model) {
        case '1c' :
            //console.log(`Using model 1c with parameters: D=${p['D']}, Vd=${p['Vd']}, ka=${p['ka']}, ke=${p['ke']}`);
            return model_1c(t, p['D'], p['Vd'], p['ka'], p['ke']);
        case '2c' :
            return model_2c(t, p['D'], p['V'], p['ka'], p['k21'], p['a'], p['b']);
        case '3c' :
            return model_3c(t, p['D'], p['V'], p['ka'], p['k21'], p['k31'], p['a'], p['b'], p['g']);
        case 'v3c':
            //console.log(`Using model v3c with parameters: D=${p['D']}, k1=${p['k1']}, k2=${p['k2']}, k3=${p['k3']}`);
            return model_v3c(t, p['D'], p['k1'], p['k2'], p['k3']);
        case 'v4c':
            return model_v4c(t, p['D'], p['k1'], p['k2'], p['k3'], p['k4']);
        case 'bateman':
            const ke = Math.LN2 / p['halflife'];
            // Solve absorption rate constant (ka) from tmax via Newton's method
            // tmax = ln(ka/ke) / (ka - ke)  →  solve for ka
            let ka = 3 * ke;
            for (let i = 0; i < 200; i++) {
                if (ka <= ke) ka = ke * 1.001;
                const diff = ka - ke;
                const logRatio = Math.log(ka / ke);
                const f = logRatio / diff - p['tMax'];
                const df = (1 / ka * diff - logRatio) / (diff * diff);
                ka -= f / df;
                if (Math.abs(f / df) < 1e-14) break;
            }
            if (ka <= ke || !isFinite(ka)) ka = ke * 2;
            const peakTime = Math.log(ka / ke) / (ka - ke);
            const peakVal = Math.exp(-ke * peakTime) - Math.exp(-ka * peakTime);

            const S = (p['cMax']) / peakVal;
           return model_bateman(t, S , ka, ke);
    }
}

function model_1c(t, D, Vd, ka, ke) {
    return (D * ka) / (Vd * (ka - ke)) * (Math.exp(-ke * t) - Math.exp(-ka * t));
}

function model_2c(t, D, V, ka, k21, a, b) {
    var A = (ka / V) * ((k21 - a) / (ka - a) * (b - a))
    var B = (ka / V) * ((k21 - b) / (ka - b) * (a - b))
    return D * (A * Math.exp(-a * t) + B * Math.exp(-b * t) - (A + B) * Math.exp(-ka * t));
}

function model_3c(t, D, V, ka, k21, k31, a, b, g) {
    var A = (1 / V) * (ka / (ka - a)) * ((k21 - a) / (a - b)) * ((k31 - a) / (a - g))
    var B = (1 / V) * (ka / (ka - b)) * ((k21 - b) / (b - a)) * ((k31 - b) / (b - g))
    var C = (1 / V) * (ka / (ka - g)) * ((k21 - g) / (g - b)) * ((k31 - g) / (g - a))
    return D * (A * Math.exp(-a * t) + B * Math.exp(-b * t) + C * Math.exp(-g * t) - ((A + B + C) * Math.exp(-ka * t)));
}

function model_v3c(t, D, k1, k2, k3) {
    return D * k1 * k2 * (Math.exp(-t * k1) / ((k1 - k2) * (k1 - k3)) +
        Math.exp(-t * k3) / ((k1 - k3) * (k2 - k3)) +
        (Math.exp(-t * k2) * (k3 - k1)) / ((k1 - k2) * (k1 - k3) * (k2 - k3)));
}

function model_v4c(t, D, k1, k2, k3, k4) {
    return (-D * k1 * k2 * k3 * (
            (k2 * k2 * k3 - k2 * k3 * k3 - k2 * k2 * k4 + k3 * k3 * k4 + k2 * k4 * k4 - k3 * k4 * k4) * Math.exp(-k1 * t)
            + (-k1 * k1 * k3 + k1 * k3 * k3 + k1 * k1 * k4 - k3 * k3 * k4 - k1 * k4 * k4 + k3 * k4 * k4) * Math.exp(-k2 * t)
            + (k1 * k1 * k2 - k1 * k2 * k2 - k1 * k1 * k4 + k2 * k2 * k4 + k1 * k4 * k4 - k2 * k4 * k4) * Math.exp(-k3 * t)
            + (-k1 * k1 * k2 + k1 * k2 * k2 + k1 * k1 * k3 - k2 * k2 * k3 - k1 * k3 * k3 + k2 * k3 * k3) * Math.exp(-k4 * t))
        / ((k1 - k2) * (k1 - k3) * (k2 - k3) * (k1 - k4) * (k2 - k4) * (k3 - k4)));
}
function model_bateman(t, S, ka, ke) {
    if (t <= 0) return 0;
    return S * (Math.exp(-ke * t) - Math.exp(-ka * t));
}
// Convert concentration units (e.g., pg/mL to pmol/L)
function convert_concentration_units(C, unit_from, unit_to, mol_weight) {
    if (unit_from == unit_to) {
        return C;
    } else if (unit_from == 'pg/mL' && unit_to == 'pmol/L') {
        C = C / mol_weight * 1000;
    } else if (unit_from == 'pmol/L' && unit_to == 'pg/mL') {
        C = C * mol_weight / 1000;
    } else if (unit_from == 'ng/dL' && unit_to == 'nmol/L') {
        C = C / mol_weight * 10;
    } else if (unit_from == 'nmol/L' && unit_to == 'ng/dL') {
        C = C * mol_weight / 10;
    } else if (unit_from == 'ng/mL' && unit_to == 'nmol/L') {
        C = C / mol_weight * 1000;
    } else if (unit_from == 'nmol/L' && unit_to == 'ng/mL') {
        C = C * mol_weight / 1000;
    } else if (unit_from == 'pg/mL' && unit_to == 'ng/dL') {
        C = C / 10;
    } else if (unit_from == 'pg/mL' && unit_to == 'nmol/L') {
        C = (C / mol_weight);
    } else {
    }
    return C;
}

