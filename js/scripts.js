/**
 * Initialization code, run after entire page has loaded.
 */
$(document).ready(function () {
    $("#calculator").submit(function (e) {
        
        // Prevent page from refreshing
        e.preventDefault();

        var addressPlain = $("#street").val() +
            ", " + $("#city").val() +
            ", CO " + $("#postal").val();
        var address = encodeURIComponent(addressPlain);
        l = new LocationCollection(null, {
            address: address
        });
        l.fetch({
            success: function () {
                var loc = l.models[0].attributes.geometry.location;
                console.log(loc);
                for (var i = 0; i < districts.features.length; i++) {
                    f = districts.features[i];
                    if (d3.geoContains(f, [loc.lng, loc.lat])) {
                        console.log(f);
                    }
                }
            }
        });
        
        return false;
    });

});

