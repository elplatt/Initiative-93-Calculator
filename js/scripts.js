/**
 * Convert TopoJSON to GeoJSON.
 */
districtGeo = topojson.feature(districtsTopo, districtsTopo.objects.CDPHE_CDOE_School_District_Boundaries);

/**
 * Initialization code, run after entire page has loaded.
 */
$(document).ready(function () {
    
    // Create backbone models and views
    var result = new ResultModel({});
    var view = new CalculatorView();
    $('#main-container').append(view.el);
    resultView = new ResultView({ model: result });
    $('#main-container').append(resultView.el);
    
    // Set up backbone routes
    var router = new AppRouter();
    router.on('route:calculator', function() {
        view.$el.show();
        resultView.$el.html("");
        $("#income").focus();
    });
    router.on('route:result', function () {
        if (typeof(result.get('taxInfo')) === 'undefined') {
            router.navigate('calculator', {trigger: true});
            return;
        }
        view.$el.hide();
        resultView.render();
    });
    Backbone.history.start();
    $("input:text").focus(function () { this.select(); });
    $("#income").focus();
    
    // Handle calculator submission
    $("#calculator").submit(function (e) {
        
        // Prevent page from refreshing
        e.preventDefault();

        // Create model to hold results
        var businessProperty = $("#businessPropertyYes").is(":checked");
        result.set({business: businessProperty});
        
        // Construct home address and get individual tax info
        var addressPlain = $("#street").val() +
            ", " + $("#city").val() +
            ", CO " + $("#postal").val();
        var address = encodeURIComponent(addressPlain);
        var l = new LocationCollection(null, {
            address: address
        });
        var individualComplete = l.fetch({ success: function () {
            var loc = l.models[0].attributes.geometry.location;
            var homeDistrict = getDistrict(loc);
            result.set({ homeDistrict: homeDistrict });
            var taxInfo = getTax(
                parseDollar($("#income").val()),
                parseDollar($("#passthrough").val()));
            var propertyTaxInfo = getPropertyTaxHome(
                parseDollar($("#homeValue").val()),
                homeDistrict);
            result.set({
                taxInfo: taxInfo,
                propertyTaxInfo: propertyTaxInfo
            });
        }});
        
        // Construct business address and get business tax info
        var businessComplete;
        if (businessProperty) {
            var businessAddressPlain = $("#businessStreet").val() +
                ", " + $("#businessCity").val() +
                ", CO " + $("#businessPostal").val();
            var businessAddress = encodeURIComponent(businessAddressPlain);
            bl = new LocationCollection(null, {
                address: businessAddress
            });
            businessComplete = bl.fetch({ success: function () {
                var loc = bl.models[0].attributes.geometry.location;
                var businessDistrict = getDistrict(loc);
                var businessTaxInfo = getPropertyTaxBusiness(
                    parseDollar($("#businessValue").val()),
                    businessDistrict);
                result.set({
                    businessTaxInfo: businessTaxInfo
                });
            }});
        }
        
        // Wait for calculation to complete
        var complete;
        if (businessProperty) {
            complete = $.when(individualComplete, businessComplete);
        } else {
            complete = individualComplete;
        }
        complete.then(function () {
            router.navigate('result', {trigger: true});
        });
        
        return false;
    });
});

/**
 * Backbone router to handle navigation.
 */
var AppRouter = Backbone.Router.extend({
    routes: {
        "": "calculator",
        "calculator": "calculator",
        "result": "result"
    }
});
var router = new AppRouter();


/**
 * Tax calculation code
 */
var taxBrackets = [
    {"max": 5000, "fti": 0, "agi": 196150},
    {"max": 10000, "fti": 0, "agi": 894451},
    {"max": 15000, "fti": 90906, "agi": 1797216},
    {"max": 20000, "fti": 570030, "agi": 2578781},
    {"max": 25000, "fti": 1077294, "agi": 3197100},
    {"max": 35000, "fti": 3569116, "agi": 7569935},
    {"max": 50000, "fti": 73569116, "agi": 12134442},
    {"max": 75000, "fti": 14010762, "agi": 19990028},
    {"max": 100000, "fti": 14199255, "agi": 18590767},
    {"max": 250000, "fti": 42254500, "agi": 50815382},
    {"max": 999000000, "fti": 29713671, "agi": 32807169}
];
var stateBrackets = [0, 150000, 200000, 300000, 500000];
var stateRates = [4.63, 5, 6, 7, 8.25];
//var stateCorporateRate = 6;

var getDistrict = function (loc) {
    var geoid;
    for (var i = 0; i < districtGeo.features.length; i++) {
        f = districtGeo.features[i];
        if (d3.geoContains(f, [loc.lng, loc.lat])) {
            geoid = parseInt(f.properties.GEOID);
        }
    }
    for (i = 0; i < districtInfo.length; i++) {
        if (parseInt(districtInfo[i].geoid) == geoid) {
            return districtInfo[i];
        }
    }
    return null;
};

var getTax = function (personalIncome, passthroughIncome) {
    // Adjusted gross income
    var agi = personalIncome - 0.2 * passthroughIncome;
    // Federal taxable income
    var fti = 0;
    var i;
    var bracket;
    for (i = 0; i < taxBrackets.length; i++) {
        bracket = taxBrackets[i];
        if (agi <= bracket.max) {
            fti = agi * bracket.fti / bracket.agi;
            break;
        }
    }
    // Graduated state income tax
    var low, high;
    var graduated = 0;
    var bracketTax;
    var bracketAmounts = [];
    for (i = 0; i < stateBrackets.length; i++) {
        // Handle highest bracket as a special case
        if (i == stateBrackets.length - 1) {
            low = stateBrackets[i];
            if (fti <= low) {
                break;
            }
            bracketTax = stateRates[i] * (fti - low) / 100;
        } else {
            // Determine the bounds of the bracket and how much income is
            // taxed at this rate
            low = stateBrackets[i];
            high = stateBrackets[i+1];
            if (fti >= high) {
                bracketTax = stateRates[i] * (high - low) / 100;
            } else if (fti > low) {
                bracketTax = stateRates[i] * (fti - low) / 100;
            } else {
                break;
            }
        }
        graduated += bracketTax;
        bracketAmounts.push(bracketTax);
    }
    // Flat state income tax
    var flat = 0.0463 * fti;
    var taxInfo = {
        "graduated": graduated,
        "flat": flat,
        "fti": fti,
        "income": personalIncome,
        "passthrough": passthroughIncome,
        "bracketAmounts": bracketAmounts
    };
    return taxInfo;
};

var getPropertyTaxHome = function (homeValue, homeDistrict) {
    var propertyTaxHome = {
        "program72": 0.072 * homeValue * homeDistrict.total_program_mills / 1000,
        "program70": 0.070 * homeValue * homeDistrict.total_program_mills / 1000,
        "total72": 0.072 * homeValue * homeDistrict.total_levy / 1000,
        "total70": 0.070 * homeValue * homeDistrict.total_levy / 1000,
        "homeValue": homeValue
    };
    propertyTaxHome.low = propertyTaxHome.program72 - propertyTaxHome.program70;
    propertyTaxHome.high = propertyTaxHome.total72 - propertyTaxHome.total70;
    return propertyTaxHome;    
};

var getPropertyTaxBusiness = function (businessValue, businessDistrict) {
    var propertyTaxBusiness = {
        "program29": 0.29 * businessValue * businessDistrict.total_program_mills / 1000,
        "program24": 0.24 * businessValue * businessDistrict.total_program_mills / 1000,
        "total29": 0.29 * businessValue * businessDistrict.total_levy / 1000,
        "total24": 0.24 * businessValue * businessDistrict.total_levy / 1000,
        "businessValue": businessValue
    };
    propertyTaxBusiness.low = propertyTaxBusiness.program29 - propertyTaxBusiness.program24;
    propertyTaxBusiness.high = propertyTaxBusiness.total29 - propertyTaxBusiness.total24;
    return propertyTaxBusiness;
};

var dollars = function (n) {
    return "$" + Number(Math.round(Math.abs(n))).toLocaleString();
};

var parseDollar = function (s) {
    return parseInt(s.replace(/[,|\s|\$]/g, ""));
};
