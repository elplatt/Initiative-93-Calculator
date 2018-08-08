CalculatorView = Backbone.View.extend({
    template: _.template($('#tpl-calculator-view').html()),
    initialize: function () {
        this.render();
    },
    render: function () {
        this.$el.html(this.template);
        this.$el.find("#businessYes").on('click', this.onBusinessClick);
        this.$el.find("#businessNo").on('click', this.onBusinessClick);
        this.$el.find("#businessPropertyYes").on('click', this.onBusinessPropertyClick);
        this.$el.find("#businessPropertyNo").on('click', this.onBusinessPropertyClick);
    },
    onBusinessClick: function () {
        // Check if turned on or off and display or hide additional info
        if ($("#businessYes").is(":checked")) {
            $('#business-group').slideDown(500);
        } else {
            $('#business-group').slideUp(500);
            $('#business-property-group').slideUp(500);
            $('#businessPropertyNo').prop("checked", "true");
        }
    },
    onBusinessPropertyClick: function () {
        // Check if turned on or off and display or hide additional info
        if ($("#businessPropertyYes").is(":checked")) {
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
        $('#schoolDistrict').html(district.school_district);
        $('#perStudent').html(dollars(district.funding_increase / district.pupil_count));
        $('#total').html(dollars(district.funding_increase));
    }
});
