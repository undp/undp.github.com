---
---
(function() {
    var BASE_URL = '/',
        models = {},
        views = {},
        routers = {},
        templates = _($('script[name]')).reduce(function(memo, el) {
            memo[el.getAttribute('name')] = _(el.innerHTML).template();
            return memo;
        }, {}),
        app = {},
        facets = [
            {
                id: 'operating_unit',
                url: 'api/operating-unit-index.json',
                name: 'Country Office / Operating Unit'
            },
            {
                id: 'region',
                url: 'api/region-index.json',
                name: 'Region'
            },
            {
                id: 'focus_area',
                url: 'api/focus-area-index.json',
                name: 'UNDP Focus Area'
            },
            {
                id: 'donor_countries',
                url: 'api/donor-country-index.json',
                name: 'Funding by Country'
            },
            {
                id: 'donors',
                url: 'api/donor-index.json',
                name: 'Funding Source'
            }
        ];

    // Models
    {% include models/Filter.js %}
    {% include models/Project.js %}
    {% include models/TopDonor.js %}

    // Views
    {% include views/App.js %}
    {% include views/Filters.js %}
    {% include views/Projects.js %}
    {% include views/ProjectProfile.js %}
    {% include views/Map.js %}
    {% include views/TopDonors.js %}
    {% include views/Widget.js %}

    // Router
    {% include routers/Router.js %}

    // String helper
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

    // To Title Case 2.0.1 – http://individed.com/code/to-title-case/
    // Copyright © 2008–2012 David Gouch. Licensed under the MIT License.
    String.prototype.toTitleCase = function () {
      var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|vs?\.?|via)$/i;

      return this.replace(/([^\W_]+[^\s\-]*) */g, function (match, p1, index, title) {
        if (index > 0 && index + p1.length !== title.length &&
          p1.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
          title.charAt(index - 1).search(/[^\s\-]/) < 0) {
          return match.toLowerCase();
        }

        if (p1.substr(1).search(/[A-Z]|\../) > -1) {
          return match;
        }

        return match.charAt(0).toUpperCase() + match.substr(1);
      })
        // Words that should be all caps
        .replace(/Un\b/g, 'UN ')
        .replace(/Undp/g, 'UNDP')
        .replace(/Unesco/g, 'UNESCO')
        .replace(/Unfip/g, 'UNFIP')
        .replace(/Unocha\/central_emg_resp_fund/g, 'UNOCHA Central Emg Resp Fund')
        .replace(/Unocha/g, 'UNOCHA')
        .replace(/Mdtfo\\jp_mdg-F_conflict_\&_pb/g, 'MDTFO / JP MDG-F Conflict & PB')
        .replace(/Bcpr/g, 'BCPR')
        .replace(/Dfid/g, 'DFID')
        .replace(/Usaid/g, 'USAID')
        .replace(/Unaids/g, 'UNAIDS')
        .replace(/Mdtfo\\jp_peace_building_fund/g, 'MDTFO / JP Peace Building Fund')
        .replace(/Aa for Jp/g, 'AA for JP')
        .replace(/Gtz\b/g, 'GTZ')
        .replace(/Mdg\b/g, 'MDG')
        .replace(/Hiv\b/g, 'HIV')
        .replace(/Bra\b/g, 'BRA')
        .replace(/Ii\b/g, 'II')
        .replace(/Iii\b/g, 'III')
        .replace(/Iv\b/g, 'IV')
        .replace(/Vi\b/g, 'VI')
        .replace(/Vii\b/g, 'VII');
    };

    // Start the application
    $(function() {
        app = new routers.App();
        Backbone.history.start();
    });
})();
