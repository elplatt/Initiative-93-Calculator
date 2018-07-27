/**
 * Model for single Google Geocoding API result
 */
var Location = Backbone.Model.extend({
});

/**
 * Collection for collection Google Geocoding API result.
 *
 * params
 *   key: Google API key
 */
var LocationCollection = Backbone.Collection.extend({
    model: Location,
    initialize: function (models, options) {
        this.options = options;
    },
    url: function () {
        return "https://maps.googleapis.com/maps/api/geocode/json?" +
            "&key=" + app.config.googleApiKey +
            "&address=" + this.options.address;
    },
    parse: function (response) {
        return response.results;
    }
});

/**
 * Model for tax calculation result
 */
var ResultModel = Backbone.Model.extend({});
