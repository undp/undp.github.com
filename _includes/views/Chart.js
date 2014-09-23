function renderFocusAreaChart(chartData, rootPath, view) {
    var $el = $('#chart-focus_area');
    $el.empty();

    // Calculate budget for each focus area
    var totalBudget = _(chartData).reduce(function(budget, focusArea) {
        return budget + (focusArea.get('budget') || 0);
    }, 0) || 0;


    // For each focus area, fill the template with the percentage value
    var template = _.template($("#focusAreaItemTemplate").html());
    _(chartData).each(function(model, index) {
        var focusIconClass = model.get('name').replace(/\s+/g, '-').toLowerCase().split('-')[0];
        var focusName = model.get('name').toLowerCase().toTitleCase();
        var value = _(((model.get('budget') || 0) / totalBudget)).isNaN() ? 0 :
                    ((model.get('budget') || 0) / totalBudget * 100).toFixed(0);

        $el.append(template({
            id: model.id,
            path: rootPath + view.collection.id + '-' + model.id,
            focusName: focusName,
            focusIconClass: focusIconClass,
            value: value
        }))

        //Set css for each item
        $('.fa' + (model.id) + ' .pct span')
        .css('width', value * 2) // the width of the percentage block corresponds to the value visually, times 2 to make it legible
        .text(value === '0' ? value : value + '%');

    });

    //Add title
    $el.prepend('<h3 id="focus">Themes <span>% of budget</span></h3>');
}

//This function filters projects according to a donor country and a budget source
//and calculates budget and expenditure
// If a model is present, it only selects projects whose operating_unit is that model
function calculateStatistic(budgetSource, donorCountry, operating_unit) {
    var donorProjects = (donorCountry || budgetSource) ? global.projects.chain()
        .filter(function(project) {
            //Filter if there's a model -> we are looking for projects that match either a funding country or funded country
            return (typeof operating_unit !== 'undefined')? (project.get('operating_unit') == operating_unit) : true;
        })
        .map(function(project) {
            //If there is a donor country, only select projects where 'donor_countries' == donorCountry
            //Else, select projects where 'donors' is budgetSource
            var donorIndex = _(project.get( ((donorCountry)?'donor_countries':'donors') )).indexOf((donorCountry || budgetSource));

            if (donorIndex === -1) return;
            return {
                budget: project.get('donor_budget')[donorIndex],
                expenditure: project.get('donor_expend')[donorIndex]
            };
        }, 0).compact().value() : [];

    var donorBudget = _(donorProjects).chain().pluck('budget')
                .reduce(function(memo, num){ return memo + num; }, 0).value();

    var donorExpenditure = _(donorProjects).chain().pluck('expenditure')
        .reduce(function(memo, num){ return memo + num; }, 0).value();

    return {
        expenditure: donorExpenditure,
        budget: donorBudget
    }
}

function setMapInfo(donorInfo, model, budgetSource) {
    // if (budgetSource) global.projects.mapView.collection.donorID = false;
    // global.projects.mapView.collection.operating_unitBudget[model.get('id')] = donorInfo.budget;
    // global.projects.mapView.collection.operating_unitExpenditure[model.get('id')] = donorInfo.expenditure;
}

function setBudgetHTML(donorInfo, model, isFiltered, pathTo) {
    var donorBudget = donorInfo.budget;
    var donorExpenditure = donorInfo.expenditure;

    //Template of chart row
    var chartTemplate = _.template($("#budgetChartItemTemplate").html());

    var budget = accounting.formatMoney(
            ((isFiltered) ? donorBudget : model.get('budget')),"$", 0, ",", "."
        );
    var budgetWidth = (isFiltered) ? (donorBudget) : (model.get('budget'));
    var expenditureWidth = (isFiltered) ? (donorExpenditure) : (model.get('expenditure'));

    if (budget!='$0') {
        return {
            sort: -1 * budgetWidth,
            fund_type: model.attributes.fund_type,
            content: chartTemplate({
                path: pathTo + model.collection.id + '-' + model.get('id'),
                budgetWidth: budgetWidth,
                expenditureWidth: expenditureWidth,
                name: model.get('name').toLowerCase().toTitleCase(),
                budget: budget
            })
        };
    }
}

function addRows(selector, rows, view) {
    rows = _(rows).sortBy('sort');
    var max = rows[0].sort * -1;
    rows = rows.slice(0,19);
    _(rows).each(function(row) {
        selector.append(row.content);
    },view);

    selector.children().each(function() {
        $('.data .budgetdata', this).width(($('.data .budgetdata', this).attr('data-budget') / max * 100) + '%');
        $('.data .subdata', this).width(($('.data .subdata', this).attr('data-expenditure') / max * 100) + '%');
    });
    if (view.donorCountry) $('#total-donors').html(view.chartModels.length);
}

function renderBudgetSourcesChart(chartData, pathTo, view) {
    var donorCountry = (_(global.processedFacets).find(function(filter) {
        return filter.facet === 'donor_countries';
    }) || {id: 0}).id;

    var rows = [];

    _(chartData).each(function(model) {
        donorInfo = calculateStatistic(model.id, donorCountry)
        setMapInfo(donorInfo, model, model.id);
        var rowHTML = setBudgetHTML(donorInfo, model, true, pathTo)
        rows.push(rowHTML);
    }, view)


    if (rows.length > 0 ) addRows($('#chart-' + view.collection.id + ' .rows'), rows, view);
}

function renderRecipientOfficesChart(chartData, view, pathTo) {

    var budgetSource = (_(global.processedFacets).find(function(filter) {
        return filter.facet === 'donors';
    }) || {id: 0}).id;

    var donorCountry = (_(global.processedFacets).find(function(filter) {
        return filter.facet === 'donor_countries';
    }) || {id: 0}).id;

    var localRows = [];
    var otherRows = [];
   _(chartData).each(function(model) {

        donorInfo = calculateStatistic(budgetSource, donorCountry, model.id);
        if (budgetSource || donorCountry) {
            setMapInfo(donorInfo, model, budgetSource);
        }
        var rowHTML = setBudgetHTML(donorInfo, model, (budgetSource || donorCountry), pathTo)
        if (rowHTML.fund_type === 'Local') {
            localRows.push(rowHTML);
        } else {
            otherRows.push(rowHTML);
        }
    }, view)

    if (localRows.length > 0) addRows($('#chart-' + view.collection.id + ' #localTab .rows'), localRows, view);
    if (otherRows.length > 0) addRows($('#chart-' + view.collection.id + ' #partnerTab .rows'), otherRows, view);

}