CalculatorView = Backbone.View.extend({
    template: _.template($('#tpl-calculator-view').html()),
    initialize: function () {
        this.render();
    },
    render: function () {
        this.$el.html(this.template);
        this.$el.find("#business").on('click', this.onBusinessClick);
        this.$el.find("#businessProperty").on('click', this.onBusinessPropertyClick);
    },
    onBusinessClick: function (e) {
        // Check if turned on or off and display or hide additional info
        if ($(e.currentTarget).is(":checked")) {
            $('#business-group').slideDown(500);
        } else {
            $('#business-group').slideUp(500);
        }
    },
    onBusinessPropertyClick: function (e) {
        // Check if turned on or off and display or hide additional info
        if ($(e.currentTarget).is(":checked")) {
            $('#business-property-group').slideDown(500);
        } else {
            $('#business-property-group').slideUp(500);
        }
    }
});

ResultView = Backbone.View.extend({
    template: _.template($('#tpl-result-view').html()),
    model: ResultModel,
    initialize: function() {
    },
    render: function ()  {
        var taxInfo = this.model.get('taxInfo');
        var propertyTaxInfo = this.model.get('propertyTaxInfo');
        var homeDistrict = this.model.get('homeDistrict');
        this.$el.html(this.template);
        $('#resultIncome').html(dollars(taxInfo.income));
        $('#taxResult').html(dollars(taxInfo.fti));
        $('#extraTax').html(dollars(taxInfo.graduated - taxInfo.flat));
        $('#homeResult').html(dollars(propertyTaxInfo.homeValue));
        $('#homeLow').html(dollars(propertyTaxInfo.low));
        $('#homeHigh').html(dollars(propertyTaxInfo.high));
        $('#schoolDistrict').html(homeDistrict.school_district_name);
        
        d3.selectAll('.animate')
            .transition()
            .duration(1000)
            .tween("text", function() {
                var that = d3.select(this),
                  i = d3.interpolateNumber(0, that.text().replace(/[,|$]/g, ""));
                return function (t) { that.text(dollars(i(t))); };
            });
        
        if (this.model.get('business')) {
            var businessTaxInfo = this.model.get('businessTaxInfo');
            $('#businessLow').html(dollars(businessTaxInfo.low));
            $('#businessHigh').html(dollars(businessTaxInfo.high));
            $('#businessResult').html(dollars(businessTaxInfo.businessValue));
            $('.business').show();
            $('.individual').hide();
        } else {
            $('.individual').show();
            $('.business').hide();
        }
        var district = this.model.get('homeDistrict');
        $('#schoolDistrict').html(district.school_district_name);
        $('#perStudent').html(dollars(district.funding_increase / district.pupil_count));
        $('#total').html(dollars(district.funding_increase));
    }
});
