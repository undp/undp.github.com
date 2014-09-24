// a donor collection built with the donors.json
// with two built in filter machanism
// one for the total, one for the selected donor
Donors = Backbone.Collection.extend({
    url:'api/donors/donors.json',
    total:function(){
        var total = this.filter(function(m){return m.get('donor-country') === 'all';});
        return new Donors(total)
    },
    selectedDonor: function(donor){
        var selected = this.filter(function(m){return m.get('donor-country') === donor;});
        return new Donors(selected)
    },
    initialize:function(){}
});

// shortens millions and thousands;
// attach to window b/c it's called in _includes/templates/donorViz._
window.abbreviateNumber = function(n) {
  return n > 1000000 ? (+(n / 1000000).toFixed(1)).toLocaleString() + 'M' :
    n > 1000 ? (+(n / 1000).toFixed(1)).toLocaleString() + 'K' : n.toLocaleString();
};

views.Donors = Backbone.View.extend({
    el: '#donor-graphs',
    // see the template in _includes/templates/donorViz._
    // selecting #donorViz since it's the id of the template script, see _includes/templates.html
    // which is included in index.html
    template: _.template($('#donorViz').html()),
    initialize: function() {

        app.donor = true;

        this.allDonors = new Donors();
        this.listenTo(this.allDonors,'sync',this.render);
        this.allDonors.fetch();
        this.$core = $('#totalCoreContribution');
        this.$nonCore = $('#totalNonCoreContribution');
    },
    render: function() {
        var that = this;
        var donor = _(global.processedFacets).where({ collection: 'donor_countries' });
            donor = (donor.length) ? donor[0].id : false;

        // total and donor related items from collection
        // are being calculated
        var total = this.allDonors.total(); // total amount of the core + non-core
        var collection = this.allDonors.selectedDonor(donor); // amount of the core + non-core of the specific donor

        var core = collection.findWhere({'name': 'core'}).get('value');
        var nonCore = collection.findWhere({'name': 'non-core'}).get('value');
        var overallContrib = core + nonCore;

        // varibles that power the table and graph
        var base = {
            // contributions of this particular donor in each category
            core: core,
            nonCore: nonCore,
            costSharing: collection.findWhere({'name': 'cost sharing'}).get('value'),
            unv: collection.findWhere({'name': 'unv'}).get('value'),
            specialActivities: collection.findWhere({'name': 'special activities'}).get('value'),
            trustFunds: collection.findWhere({'name': 'trust funds'}).get('value'),
            thematicTrustFunds: collection.findWhere({'name': 'thematic trust funds'}).get('value'),

            // total contributions in each category
            coreTotal: total.findWhere({'name': 'core'}).get('value'),
            nonCoreTotal: total.findWhere({'name': 'non-core'}).get('value'),
            costSharingTotal: total.findWhere({'name': 'cost sharing'}).get('value'),
            unvTotal: total.findWhere({'name': 'unv'}).get('value'),
            specialActivitiesTotal: total.findWhere({'name': 'special activities'}).get('value'),
            trustFundsTotal: total.findWhere({'name': 'trust funds'}).get('value'),
            thematicTrustFundsTotal: total.findWhere({'name': 'thematic trust funds'}).get('value'),
          };

        var calc = {
            // percentage (allocation) of donor's contributions in core vs. non-core funds
            coreAllocation: core / overallContrib,
            nonCoreAllocation: nonCore / overallContrib,

            // percentage (allocation) of donor's contributions to each non-core fund category
            costSharingAllocation: base.costSharing / nonCore,

            unvAllocation: base.unv / nonCore,
            specialActivitiesAllocation: base.specialActivities / nonCore,
            trustFundsAllocation: base.trustFunds / nonCore,
            thematicTrustFundsAllocation: base.thematicTrustFunds / nonCore,

            // donor's percentage of the total UNDP funds in each category
            corePct: core / base.coreTotal,
            nonCorePct: nonCore / base.nonCoreTotal,
            costSharingPct: base.costSharing / base.costSharingTotal,
            unvPct: base.unv / base.unvTotal,
            specialActivitiesPct: base.specialActivities / base.specialActivitiesTotal,
            trustFundsPct: base.trustFunds / base.trustFundsTotal,
            thematicTrustFundsPct: base.thematicTrustFunds / base.thematicTrustFundsTotal
        };

        for (var key in calc) {
          calc[key] = (calc[key] * 100).toFixed(1);
        }

        var variables = $.extend({}, calc, base);

        // Core donations
        this.$core.text(variables.core.toLocaleString());
        this.$nonCore.text(variables.nonCore.toLocaleString());

        // Percentage of total core contributions (all donors)
        $('#corePercentageTotal').html(variables.corePct);

        // Make the % of total core contributions bar chart
        coreData = [[variables.corePct, 0]];
        var data = [
        {
            label: "Core",
            data: coreData,
            bars: {
                show: true,
                fill: true,
                lineWidth: 1,
                fillColor:  "#0055AA",
                horizontal: true,
                barWidth: 0.5,
                align: 'center'
            },
            color: "#0055AA"
        }];

        $.plot($('#percentCoreBar'), data, {
                xaxis: {
                  axisLabel: 'Percent of Total Core Contributions',
                  axisLabelUseCanvas: true,
                  axisLabelFontSizePixels: 12,
                  axisLabelFontFamily: 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
                  axisLabelPadding: 5,
                  max: 100,
                  tickColor: 'black'
              },
              yaxis: {
                  axisLabelUseCanvas: true,
                  axisLabelFontSizePixels: 12,
                  axisLabelFontFamily: 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
                  axisLabelPadding: 5,
                  ticks: false
              },
              legend: {
                  show: false,
                  labelBoxBorderColor: "none",
                  labelFormatter: function(label, series) {
                    pct = parseFloat(series.data[0][1]).toFixed(2);
                    return label+' - '+pct+'%';
                  }
              }
          });

        // Make the Core vs. Non-Core Pie Chart
        data = [{label: 'Core', data: variables.core, color: "#0055AA"},
               {label: 'Non-Core', data: variables.nonCore, color: "#ecf0f1"}];
        $.plot($('#donorPieChart'), data, {
                series: {
                  pie: {
                      show: true,
                      radius: .9
                  },
                  label: {
                    show: true,
                    formatter: function(label, series) {
                      return '<div style="font-size:11px; text-align:center; color:black">'+label+'<br/>'+Math.round(series.percent)+'%<br/>$'+series.data+'</div>';
                    }
                  }
                },
                legend: {
                    show: false,
                    // labelBoxBorderColor: "none",
                    // labelFormatter: function(label, series) {
                      // pct = series.percent.toFixed(2);
                      // return label+' - '+pct+'% ($'+series.data[0][1].toLocaleString()+')';
                    // }
                }
        });

        // Make non-core modalities chart
        this.$el.html(this.template(variables));

    }

});