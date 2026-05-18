/*** Injectable Estradiol Simulator Advanced by Blahaj Luna and Aly @ Transfeminine Science (transfemscience.org) ***/
/*** Copyright of Transfeminine Science and all rights reserved (please don't reproduce) ***/
var options = {
    active_form: 'e2', // Get from HTML form instead (to-do in future)
    molecular_weight: undefined,
}
// Active form data
var active_form_data = {
    e2: {
        name: 'Estradiol',
        short_name: 'E2',
        molecular_weight: 272.38, // g/mol
    },
    test: {
        name: 'Testosterone',
        short_name: 'testosterone',
        molecular_weight: 288.42, // g/mol
    },
    nandrolone: {
        name: 'Nandrolone',
        short_name: 'nandrolone',
        molecular_weight: 274.404, // g/mol
    },
    dhea {
        name: 'DHEA',
        short_name: 'dhea',
        molecular_weight: 288, // g/mol
    },
};

// Ester data
var ester_data = {
    eb: {
        name: 'Estradiol benzoate',
        short_name: 'EB',
        dose_form: 'oil',
        trace_label_format: '<name>',
        active_form: 'e2',
        model: 'v3c',
        ester_shortcode: 'eb',
        params: {
            /* V3C */
            bioavailability: 1,
            fit_dose: 5, // mg
            D: 1.7050e+08,
            k1: 3.22397192,
            k2: 0.58870148,
            k3: 70721.4018,
        },
    },
    ev: {
        name: 'Estradiol valerate',
        short_name: 'EV',
        dose_form: 'oil',
        trace_label_format: '<name>',
        active_form: 'e2',
        model: 'v3c',
        ester_shortcode: 'ev',
        params: {
            bioavailability: 1,
            fit_dose: 5, // mg
            D: 2596.05956,
            k1: 2.38229125,
            k2: 0.23345814,
            k3: 1.37642769,
        },
    },
    ec_o: {
        name: 'Estradiol cypionate',
        short_name: 'EC oil',
        dose_form: 'oil',
        trace_label_format: '<name> <form>',
        active_form: 'e2',
        model: 'v3c',
        ester_shortcode: 'ec_o',
        params: {
            bioavailability: 1,
            /* V3C */
            fit_dose: 5, // mg
            D: 1920.89671,
            k1: 0.10321089,
            k2: 0.89854779,
            k3: 0.89359759,
        },
    },
    een: {
        name: 'Estradiol enanthate',
        short_name: 'EEn',
        dose_form: 'oil',
        trace_label_format: '<name>',
        active_form: 'e2',
        ester_shortcode: 'een',
        model: 'v3c',
        params: {
            bioavailability: 1,
            /* V3C */
            fit_dose: 5, // mg
            D: 333.874181,
            k1: 0.42412968,
            k2: 0.43452980,
            k3: 0.15291485,
        },
    },
    eu: {
        name: 'Estradiol undecylate',
        short_name: 'EU',
        dose_form: 'oil',
        trace_label_format: '<name>',
        active_form: 'e2',
        ester_shortcode: 'eu',
        model: 'v3c',
        params: {
            bioavailability: 1,
            /* V3C */
            fit_dose: 5, // mg
            D: 65.9493374,
            k1: 0.29634323,
            k2: 4799337.57,
            k3: 0.03141554,
        },
    },
    tp_o: {
        name: 'Testosterone propionate',
        short_name: 'TP oil',
        dose_form: 'oil',
        trace_label_format: '<name> <form>',
        active_form: 'test',
        ester_shortcode: 'tp_o',
        model: 'bateman',
        params: {
            fit_dose: 150,
            bioavailability: 0.84,
            halflife: 1.0375,
            cMax: 26000,
            tMax: 1.0625,
            useBatemanOnly: true,
        },
    },
    // source: https://www.sciencedirect.com/science/article/pii/S1262363626000261#sec0006
    tc_o: {
        name: 'Testosterone cypionate',
        short_name: 'TC oil',
        dose_form: 'oil',
        trace_label_format: '<name> <form>',
        active_form: 'test',
        ester_shortcode: 'tc_o',
        model: 'bateman',
        params: {
            fit_dose: 200,
            bioavailability: 1,//.7,
            halflife: 6.9,
            cMax: 11133.012, // 38.6 ± 10.3
            tMax: 4.5,
            useBatemanOnly: true,
        },
    },
    ten: {
        name: 'Testosterone enanthate',
        short_name: 'TEEn',
        dose_form: 'oil',
        trace_label_format: '<name>',
        active_form: 'test',
        ester_shortcode: 'ten',
        model: 'bateman',
        params: {
            fit_dose: 200,
            bioavailability: .72,
            halflife: 7.19,
            cMax: 11309.5,
            tMax: 1.3875,
            useBatemanOnly: true,
        },
    },
    tenwoman: {
        name: 'Testosterone enanthate (in women)',
        short_name: 'TEwomen',
        dose_form: 'oil',
        trace_label_format: '<name>',
        active_form: 'test',
        ester_shortcode: 'tenwoman',
        model: 'bateman', // Using Bateman to utilize your existing Newton's method ka solver
        params: {
            fit_dose: 250,          // Based on the standard 250mg study dose
            bioavailability: 0.85,  // Slightly higher effective bioavailability due to lower Vd
            halflife: 4.5,          // Adjusted terminal half-life from Ichihara et al.
            cMax: 29400.0,          // High peak (~29.4 ng/mL) typical for AFAB baseline
            tMax: 1.7,              // Mean peak time from study
            useBatemanOnly: true, // todo add if clause
            disableMetabolites: true,
        },
    },
    tdec: {
        name: 'Testosterone decanoate',
        short_name: 'TEdec',
        dose_form: 'oil',
        trace_label_format: '<name>',
        active_form: 'test',
        ester_shortcode: 'tdec',
        model: 'bateman',
        params: {
            fit_dose: 400,
            bioavailability: 0.65,
            halflife: 21.3,
            cMax: 11738.694, // ?
            tMax: 1.5125,
            useBatemanOnly: true,
        },
    },
    tun: {
        name: 'Testosterone undecanoate',
        short_name: 'TEUn',
        dose_form: 'oil',
        trace_label_format: '<name>',
        active_form: 'test',
        ester_shortcode: 'tun',
        model: 'bateman',
        params: {
            fit_dose: 1000,
            bioavailability: .65,
            halflife: 53,
            cMax: 12113.64,// 42 nmol // devided by 100 because was for 1000mg
            tMax: 7,
            useBatemanOnly: true,
        },
    },
    ndec: {
        name: 'Nandrolone decanoate',
        short_name: 'TEdec',
        dose_form: 'oil',
        trace_label_format: '<name>',
        active_form: 'nandrolone',
        ester_shortcode: 'ndec',
        model: 'bateman',
        params: {
            fit_dose: 100,
            bioavailability: 0.72,
            halflife: 8, // 100mg group
            cMax: 426.00, // ?
            tMax: 1.25, // 30 hrs
            useBatemanOnly: true,
        },
    },
    dhea_bb_co: {
    name: 'DHEA',
    short_name: 'DHEA BB/CO',
    dose_form: 'oil',
    trace_label_format: '<name> <form>',
    active_form: 'nandrolone',  // or metabolite if modeling downstream
    ester_shortcode: 'dhea_bb_co',  // free or minimally esterified
    model: 'bateman',
    params: {
        fit_dose: 100,  // example; adjust to your typical dose (mg). DHEA doses often 25–100+ mg
        bioavailability: 0.75,  // Estimated; slightly lower than TP due to different lipophilicity/metabolism. IM steroids generally high but vehicle affects it
        halflife: 4.5,  // days; apparent (absorption-limited). Longer than TP oil (~1 day) due to castor/BB viscosity. Shorter than TU (~20–30+ days) as DHEA is less lipophilic than undecanoate ester. Vegetable oil antipsychotics baseline ~7–10+ days; adjust upward for castor
        cMax: 1200,  // ng/dL or equivalent per fit_dose; highly variable. Scale from your TP (26000) based on dose/potency. DHEA levels are lower/nM range typically
        tMax: 3.0,  // days; delayed vs. TP due to slower vehicle release. Antipsychotic depots often peak 1–7+ days; castor/BB pushes later
        useBatemanOnly: true,
    }
    },
};

// Persistent ester list, used for share links / URL params
// Add any new esters to the end and do not remove values
// Otherwise backwards/forwards compatibility will break
var persistent_ester_list = ['eb', 'ev', 'ec_o', 'ec_s', 'een', 'eu', 'pep', 'tc_o'];

