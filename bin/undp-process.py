# ------------------------------------------
# THIS SCRIPT IS NOW OUT OF DATE. 
# ------------------------------------------
# See undp-process-xml.py for updated script 
# ------------------------------------------

# This script runs Python commands to create the JSON API. 
# Requirements: Python 2.6 or greater 
 
import csv, sys, json, time, copy, chardet
from itertools import groupby

t0 = time.time()

#Process document file by Projects
#********************************* 
documents = csv.DictReader(open('download/undp_export/report_documents.csv', 'rb'), delimiter = ',', quotechar = '"')
documents_sort = sorted(documents, key = lambda x: x['awardid'])

row_count = 0
docProject = []
docHeader = ['projectID','docName','docURL']
for id,documents in groupby(documents_sort, lambda x: x['awardid']):
    row_count = row_count + 1
    docList = [id]
    docName = []
    docURL = []
    for doc in documents:
        docName.append(doc['document_name'])
        docURL.append('http://www.undp.org/content/dam/undp/documents/projects/' + doc['document_url'])
    docList.append(docName)
    docList.append(docURL)
    docProject.append(docList)
print "Document Process Count: %d" % row_count
docProjects = []
for d in docProject:
    docProjects.append(dict(zip(docHeader,d))) # this returns a list of dicts of documents for each project


# Process donors by Projects
# **************************
donor_projects = csv.DictReader(open('download/undp_export/report_donors.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_projects_sort = sorted(donor_projects, key = lambda x: x['fiscal_year'])

row_count = 0
donorProject = []
donorProjHeader = ['projectID','donorID','donorName','donorShort','donorTypeID','donorType','donorCtyID','donorCty','donorBudget','donorExpend']
donorYearList = {}

for year,donorYears in groupby(donor_projects_sort, lambda x: x['fiscal_year']):
    for don,donors in groupby(sorted(donorYears, key = lambda x: x['awardID']), lambda x: x['awardID']):
        row_count = row_count + 1
        donorList = [don]
        donorID = []
        donorName = []
        donorShort = []
        donorTypeID = []
        donorType = []
        donorCtyID = []
        donorCty = []
        donorBudget = []
        donorExpend = []
        for d in donors:
            if d['donorID'] in donorID and d['donorID'].replace(" ","") != "":
                i = donorID.index(d['donorID'])
                donorBudget[i] += float(d['budget'])
                donorExpend[i] += float(d['expenditure'])
            if d['donorID'] not in donorID and d['donorID'].replace(" ","") != "":
                donorID.append(d['donorID'])
                if d['donorID'] == '00012':
                    donorName.append('Voluntary Contributions')
                else:
                    donorName.append(d['long_descr'])
                donorShort.append(d['short_descr'])
                donorTypeID.append(d['donor_type_lvl1'].replace(" ",""))
                donorType.append(d['donor_type_lvl1_descr'])
                if d['donor_type_lvl1'] == 'PROG CTY' or d['donor_type_lvl1'] == 'NON_PROG CTY':
                    donorCtyID.append(d['donor_type_lvl3'].replace(" ",""))
                    donorCty.append(d['donor_type_lvl3_descr'])
                elif d['donor_type_lvl1'] == 'MULTI_AGY':
                    donorCtyID.append(d['donor_type_lvl1'].replace(" ",""))
                    donorCty.append(d['donor_type_lvl1_descr'])
                else:
                    donorCtyID.append('OTH')
                    donorCty.append('OTHERS')
                donorBudget.append(float(d['budget']))
                donorExpend.append(float(d['expenditure']))
        donorList.append(donorID)
        donorList.append(donorName)
        donorList.append(donorShort)
        donorList.append(donorTypeID)
        donorList.append(donorType)
        donorList.append(donorCtyID)
        donorList.append(donorCty)
        donorList.append(donorBudget)
        donorList.append(donorExpend)
        
        donorProject.append(donorList)

    donorProjects = []
    for l in donorProject:
        donorProjects.append(dict(zip(donorProjHeader,l))) # this returns a list of dicts of donors for each project
    donorYearList[year] = donorProjects
    
print "Donors by Project Process Count: %d" % row_count

# Process donors by Outputs
# *************************
donor_outputs = csv.DictReader(open('download/undp_export/report_donors.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_outputs_sort = sorted(donor_outputs, key = lambda x: x['projectID'])

row_count = 0
donorOutput = []
donorOutHeader = ['outputID','donorID','donorName','donorShort','donorTypeID','donorType','donorCtyID','donorCty','donorBudget','donorExpend']
for don,donors in groupby(donor_outputs_sort, lambda x: x['projectID']):
    row_count = row_count + 1
    donorList = [don]
    donorID = []
    donorName = []
    donorShort = []
    donorTypeID = []
    donorType = []
    donorCtyID = []
    donorCty = []
    donorBudget = []
    donorExpend = []
    for d in donors:
        if d['donorID'] in donorID and d['donorID'].replace(" ","") != "":
            i = donorID.index(d['donorID'])
            donorBudget[i] += float(d['budget'])
            donorExpend[i] += float(d['expenditure'])
        if d['donorID'] not in donorID and d['donorID'].replace(" ","") != "":
            donorID.append(d['donorID'])
            if d['donorID'] == '00012':
                donorName.append('Voluntary Contributions')
            else:
                donorName.append(d['long_descr'])
            donorShort.append(d['short_descr'])
            donorTypeID.append(d['donor_type_lvl1'].replace(" ",""))
            donorType.append(d['donor_type_lvl1_descr'])
            if d['donor_type_lvl1'] == 'PROG CTY' or d['donor_type_lvl1'] == 'NON_PROG CTY':
                donorCtyID.append(d['donor_type_lvl3'].replace(" ",""))
                donorCty.append(d['donor_type_lvl3_descr'])
            elif d['donor_type_lvl1'] == 'MULTI_AGY':
                donorCtyID.append(d['donor_type_lvl1'].replace(" ",""))
                donorCty.append(d['donor_type_lvl1_descr'])
            else:
                donorCtyID.append('OTH')
                donorCty.append('OTHERS')
            donorBudget.append(float(d['budget']))
            donorExpend.append(float(d['expenditure']))
    donorList.append(donorID)
    donorList.append(donorName)
    donorList.append(donorShort)
    donorList.append(donorTypeID)
    donorList.append(donorType)
    donorList.append(donorCtyID)
    donorList.append(donorCty)
    donorList.append(donorBudget)
    donorList.append(donorExpend)
    donorOutput.append(donorList)

print "Donors by Output Process Count: %d" % row_count
donorOutputs = []
for l in donorOutput:
    donorOutputs.append(dict(zip(donorOutHeader,l))) # this returns a list of dicts of donors for each output

# Process Outputs 
# ***************
outputs = csv.DictReader(open('download/undp_export/report_outputs.csv', 'rb'), delimiter = ',', quotechar = '"')
outputs_sort = sorted(outputs, reverse=True, key = lambda x: (x['projectID'], x['fiscal_year']))

row_count = 0
outputs = []
outputsFull = []
outputsHeader = ['output_id','award_id','output_title','output_descr','gender_id','gender_descr','focus_area','focus_area_descr','crs','crs_descr','fiscal_year','budget','expenditure','donor_id','donor_short','donor_name','donor_type_id','donor_type','donor_country_id','donor_country','donor_budget','donor_expend']
for out,output in groupby(outputs_sort, lambda x: x['projectID']): 
    row_count = row_count + 1
    outputList = [out]
    outputAward = []
    outputTitle = []
    outputDescr = []
    outputGenID = []
    outputGenDescr = []
    outputFA = []
    outputFAdescr = []
    outputCRS = []
    outputCRSdescr = []
    outputFY = []
    outputBudget = []
    outputExpend = []
    for o in output:
        if o['awardid'] not in outputAward:
            outputAward.append((o['awardid'] if o['awardid'] != "" else "-"))
        if o['project_description'] not in outputTitle:
            outputTitle.append((o['project_description'] if o['project_description'] != "" else "-"))
        if o['project_med_de'] not in outputDescr:
            outputDescr.append((o['project_med_de'] if o['project_med_de'] != "" else "-"))
        if o['gender_marker'] not in outputGenID:
            outputGenID.append((o['gender_marker'] if o['gender_marker'] != "" else "-"))
        if o['gender_marker_descr'] not in outputGenDescr:
            outputGenDescr.append((o['gender_marker_descr'] if o['gender_marker_descr'] != "" else "-"))
        if o['focus_area'] not in outputFA:
            outputFA.append((o['focus_area'] if o['focus_area'] != "" else "-"))
        if o['fa_description'] not in outputFAdescr:
            outputFAdescr.append((o['fa_description'] if o['fa_description'] != "" else "-"))
        if o['crs'] not in outputCRS:
            outputCRS.append((o['crs'] if o['crs'] != "" else "-"))
        if o['crs_descr'] not in outputCRSdescr:
            outputCRSdescr.append((o['crs_descr'] if o['crs_descr'] != "" else "-"))
        if o['fiscal_year'] not in outputFY:
            outputFY.append((o['fiscal_year'] if o['fiscal_year'] != "" else "-"))
        outputBudget.append((float(o['budget']) if o['budget'] != "" else 0))
        outputExpend.append((float(o['expenditure']) if o['expenditure'] != "" else 0))
    outputList.append(outputAward[0])
    outputList.append(outputTitle[0])
    outputList.append(outputDescr[0])
    outputList.append(outputGenID[0])
    outputList.append(outputGenDescr[0])
    outputList.append(outputFA[0])
    outputList.append(outputFAdescr[0])
    outputList.append(outputCRS[0])
    outputList.append(outputCRSdescr[0])
    outputList.append(outputFY)
    outputList.append(outputBudget)
    outputList.append(outputExpend)
    for dOut in donorOutputs:
        if dOut['outputID'] == out:
            outputList.append(dOut['donorID'])
            outputList.append(dOut['donorShort'])
            outputList.append(dOut['donorName'])
            outputList.append(dOut['donorTypeID'])
            outputList.append(dOut['donorType'])
            outputList.append(dOut['donorCtyID'])
            outputList.append(dOut['donorCty'])
            outputList.append(dOut['donorBudget'])
            outputList.append(dOut['donorExpend'])
    outputsFull.append(dict(zip(outputsHeader,outputList))) # this returns a list of dicts of output informaiton for each output

print "Output Process Count: %d" % row_count

# Process Outputs and Aggregate for Projects
# ****************************************** 
projects = csv.DictReader(open('download/undp_export/report_projects.csv', 'rb'), delimiter = ',', quotechar = '"')
projects_sort = sorted(projects, key = lambda x: x['awardID'])
subnational = csv.DictReader(open('download/undp_export/subnational.csv','rb'), delimiter = ',', quotechar = '"')
subnational_sort = sorted(subnational, key = lambda x: x['awardID'])
units = csv.DictReader(open('download/undp_export/report_units.csv', 'rb'), delimiter = ',', quotechar = '"')
units_sort = sorted(units, key = lambda x: x['operating_unit'])
bureau = csv.DictReader(open('download/undp_export/regions.csv', 'rb'), delimiter = ',', quotechar = '"')
bureau_sort = sorted(bureau, key = lambda x: x['bureau'])
iso = csv.DictReader(open('download/undp_export/country_iso.csv', 'rb'), delimiter = ',', quotechar = '"')
iso_sort = sorted(iso, key = lambda x: x['iso3'])

row_count = 0
projects = []
projectsFull = []
projectsSmallFull = []
projectsHeader = ['project_id','project_title','project_descr','inst_id','inst_descr','inst_type_id','inst_type_descr','fiscal_year','start','end','operating_unit_id','operating_unit','region_id','region_name','outputs','document_name','subnational']
projectsSmallHeader = ['project_id','title','subnational']
for award,project in groupby(projects_sort, lambda x: x['awardID']): 
    row_count = row_count + 1
    projectList = [award]
    projectSmallList = {}
    projectSmallList['id'] = award
    projects = []
    docTemp = []
    subnationalTemp = []
    award_title = []
    award_description = [] 
    institutionid = []
    inst_descr = []
    inst_type = []
    inst_type_descr = []
    projectFY = []
    start_date = []
    end_date = []
    operatingunit = []
    ou_descr = []
    bureau = []
    bureau_description = []
    for p in project:
        if p['award_title'] not in award_title:
            award_title.append(p['award_title'])
        if p['award_description'] not in award_description:
            award_description.append(p['award_description'])
        if p['institutionid'] not in institutionid:
            institutionid.append(p['institutionid'])
        if p['inst_descr'] not in inst_descr:
            inst_descr.append(p['inst_descr'])
        if p['inst_type'] not in inst_type:
            inst_type.append(p['inst_type'])
        if p['inst_type_descr'] not in inst_type_descr:
            inst_type_descr.append(p['inst_type_descr'])
        if p['fiscal_year'] not in projectFY:
            projectFY.append(p['fiscal_year'])
        if p['start_date'] not in start_date:
            start_date.append(p['start_date'].rstrip(' 00:00:00.0'))
        if p['end_date'] not in end_date:
            end_date.append(p['end_date'].rstrip(' 00:00:00.0'))
        for op in units_sort:
            if op['operating_unit'] == p['operatingunit']:
                if p['operatingunit'] not in operatingunit:
                    operatingunit.append(p['operatingunit'])
                if op['ou_descr'] not in ou_descr:
                    ou_descr.append(op['ou_descr'])
        for b in bureau_sort:
            if b['bureau'] == p['bureau']:
                if p['bureau'] not in bureau:
                    bureau.append(p['bureau'])
                if b['bureau_description'] not in bureau_description:
                    bureau_description.append(b['bureau_description'])
    projectList.append(award_title[0])
    projectList.append(award_description[0])
    projectList.append(institutionid[0])
    projectList.append(inst_descr[0])
    projectList.append(inst_type[0])
    projectList.append(inst_type_descr[0])
    projectList.append(projectFY)
    projectList.append(start_date[0])
    projectList.append(end_date[0])
    projectList.append(operatingunit[0])
    projectList.append(ou_descr[0])
    projectList.append(bureau[0])
    projectList.append(bureau_description[0])
    
    outputTemp = []
    for out in outputsFull:
        if out['award_id'] == award:
            outputTemp.append(out)
    projectList.append(outputTemp)
    for doc in docProjects:
        if doc['projectID'] == award:
            docTemp.append(doc['docName'])
            docTemp.append(doc['docURL'])
    projectList.append(docTemp)
    for loc in subnational_sort:
        if loc['awardID'] == award or str(loc['awardID']) == award[3:]:
            locationTemp = {}
            locationTemp['lat'] = float(loc['lat'])
            locationTemp['lon'] = float(loc['lon'])
            locationTemp['type'] = loc['type']
            locationTemp['precision'] = loc['precision']
            locationTemp['scope'] = loc['scope']
            subnationalTemp.append(locationTemp)
    projectList.append(subnationalTemp)
    projectsFull.append(dict(zip(projectsHeader,projectList))) # this joins project information, output per project, and documents for each project
    
    # Add info to smaller object for op unit JSONs
    projectSmallList['title'] = award_title[0]
    projectSmallList['op_unit'] = operatingunit[0]
    projectSmallList['subnational'] = subnationalTemp
    projectsSmallFull.append(projectSmallList)

# Sort projects by operating unit
unitFinal = []
unitHeader = ['op_unit','projects','iso_num']
for unit, index in groupby(units_sort, lambda x: x['operating_unit']):  
    info = []
    listing = []
    for i in index:
        info.append(i['operating_unit'])
        for proj in projectsSmallFull:
            if i['operating_unit'] == proj['op_unit']:
                listingTemp = {}
                listingTemp['subnational'] = proj['subnational']
                listingTemp['id'] = proj['id']
                listingTemp['title'] = proj['title']
                listing.append(listingTemp)
        info.append(listing)   
    # Grab the iso number for each operating unit to match to TopoJSON
    for c in iso_sort:
        # Correct encoding for the match below
        numTemp = c['iso_num'].decode('utf-8')
        numDecode = numTemp.encode('ascii','ignore')
        isoTemp = c['iso3'].decode('utf-8')
        isoDecode = isoTemp.encode('ascii', 'ignore')
        if isoDecode == unit:
            if numDecode != "":
                info.append(numDecode)
    unitFinal.append(dict(zip(unitHeader,info))) # this joins project information, output per project, and documents for each project

# Generate JSONs for each operating unit
file_count = 0
for row in unitFinal:
    file_count = file_count + 1
    writeout = json.dumps(row, sort_keys=True, separators=(',',':'))
    f_out = open('../api/units/%s.json' % row['op_unit'], 'wb')
    f_out.writelines(writeout)
    f_out.close()
print '%d operating unit files generated...' % file_count

# Generate JSONs for each project
file_count = 0
for row in projectsFull:
    file_count = file_count + 1
    writeout = json.dumps(row, sort_keys=True, separators=(',',':'))
    f_out = open('../api/projects/%s.json' % row['project_id'], 'wb')
    f_out.writelines(writeout)
    f_out.close()
print '%d project files generated...' % file_count

## Process Project Summary file
# *****************************
projectSum = csv.DictReader(open('download/undp_export/report_projects.csv', 'rb'), delimiter = ',', quotechar = '"')
projectSum_sort = sorted(projectSum, key = lambda x: x['fiscal_year'])

regionsList = ['PAPP','RBA','RBAP','RBAS','RBEC','RBLAC']

row_count = 0
yearJson = []
yearList = []
projectSumHeaderReal = ['fiscal_year','id','name','operating_unit','region','budget','expenditure','crs','focus_area','donors','donor_types','donor_countries','donor_budget','donor_expend']
projectSumHeader = ['fiscal_year','id','name','operating_unit','region','budget','expenditure','crs','focus_area']
for year,projectYears in groupby(projectSum_sort, lambda x: x['fiscal_year']):
    projectSummary = []
    yearJson.append(year)
    yearSummary = {'year':"",'summary':""} 
    for award,summary in groupby(sorted(projectYears, key = lambda x: x['awardID']), lambda x: x['awardID']): 
        row_count = row_count + 1
        summaryList = [year]
        summaryList.append(award)
        projectFY = []
        docTemp = []
        # for s in summary:
        summaryList.append(row['project_title'])
        summaryList.append(row['operating_unit'])
        if row['region_id'] not in regionsList:
            summaryList.append('global')
        else:
            summaryList.append(row['region_id'])
        summaryList.append(float(row['budget']))
        summaryList.append(float(s['expenditure']))
        crsTemp = []
        faTemp = []
        for out in outputsFull:
            if out['award_id'] == award:
                if out['crs'] not in crsTemp:
                    crsTemp.append(out['crs'])
                if out['focus_area'] not in faTemp:
                    faTemp.append(out['focus_area'])
        summaryList.append(crsTemp)
        summaryList.append(faTemp)
        # dTemp = []
        # dtypeTemp = []
        # dCtyTemp = []
        # dBudget = []
        # dExpend = []
        # if year in donorYearList:
        #     for dProj in donorYearList[year]:
        #         if dProj['projectID'] == award:
        #             dTemp = dProj['donorID']
        #             dtypeTemp = dProj['donorTypeID']
        #             dCtyTemp = dProj['donorCtyID']
        #             dBudget = dProj['donorBudget']
        #             dExpend = dProj['donorExpend']
        # summaryList.append(dTemp)
        # summaryList.append(dtypeTemp)
        # summaryList.append(dCtyTemp)
        # summaryList.append(dBudget)
        # summaryList.append(dExpend)
        projectSummary.append(dict(zip(projectSumHeader,summaryList))) # this joins the project summary information 
    yearSummary['year'] = year
    yearSummary['summary'] = projectSummary 
    yearList.append(yearSummary)

print "Project Summary Process Count: %d" % row_count

for y in yearList:
    jsvalue = "var SUMMARY = "
    jsondump = json.dumps(y['summary'], sort_keys=True, separators=(',',':'))
    writeout = jsvalue + jsondump
    f_out = open('../api_new/project_summary_%s.js' % y['year'], 'wb')
    f_out.writelines(writeout)
    f_out.close()
    f_out = open('../api_new/project_summary_%s.json' % y['year'], 'wb')
    f_out.writelines(jsondump)
    f_out.close()
print 'Project Summary json files generated...'

# Make year index 
yearJSvalue = "var FISCALYEARS ="
yearJson.reverse()
writeout = "%s %s" % (yearJSvalue, yearJson) 
f_out = open('../api/year-index.js', 'wb')
f_out.writelines(writeout)
f_out.close()

## Process Operating Unit counts from Project Summary file
# *****************************
opUnitCount = csv.DictReader(open('download/undp_export/report_projects.csv', 'rb'), delimiter = ',', quotechar = '"')
opUnitCount_sort = sorted(opUnitCount, key = lambda x: x['operatingunit'])

row_count = 0
opUnitCounts = []
opUnitCountsHeader = ['operating_unit','project_count','funding_sources_count','budget_sum','expenditure_sum']
for opunit,summary in groupby(opUnitCount_sort, lambda x: x['operatingunit']): 
    row_count = row_count + 1
    opUnitList = [opunit]
    opUnitProj = []
    opUnitBudget = []
    opUnitDonor = []
    projectFY = []
    projCount = []
    budgetSum = []
    expendSum = []
    donorCount = []
    donors = []
    for s in summary:
        for dProj in donorProjects:
            if dProj['projectID'] == s['awardID']:
                projCount.append(1)
                for d in dProj['donorID']:
                    if d not in donors:
                        donors.append(d)
                budgetSum.append(float(s['budget']))
                expendSum.append(float(s['expenditure']))
    opUnitDonor.append(len(donors))
    opUnitList.append(sum(projCount))
    opUnitList.append(sum(opUnitDonor))
    opUnitList.append(sum(budgetSum))
    opUnitList.append(sum(expendSum))
    opUnitCounts.append(opUnitList)

opUnitprint = []
for o in opUnitCounts:
    opUnitprint.append(dict(zip(opUnitCountsHeader,o))) # this joins the project summary information


# Process CRS Index
# *****************
outputsCRS = csv.DictReader(open('download/undp_export/report_outputs.csv', 'rb'), delimiter = ',', quotechar = '"')
outputsCRS_sort = sorted(outputsCRS, key = lambda x: x['crs'])

row_count = 0
crs_index = []
crsHeader = ['id','name']
for c,crs in groupby(outputsCRS_sort, lambda x: x['crs']): 
    row_count = row_count + 1
    index = []
    if c != "":
        index.append(c)
        for cr in crs:
            index.append(cr['crs_descr'])
        crs_index.append(dict(zip(crsHeader, index)))

print "CRS Index Process Count: %d" % row_count
writeout = json.dumps(crs_index, sort_keys=True, separators=(',',':'))
f_out = open('../api/crs-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()


# Process Donor Index
# *******************
donor_index = csv.DictReader(open('download/undp_export/report_donors.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_index_sort = sorted(donor_index, key = lambda x: x['donorID'])

row_count = 0
donor_index = []
donorIndexHeader = ['id','name','country']
for don,donor in groupby(donor_index_sort, lambda x: x['donorID']): 
    row_count = row_count + 1
    index = []
    if don.replace(" ","") != "":
        index.append(don)
        for d in donor:
            index.append(d['long_descr'])
            if d['donor_type_lvl1'] == 'MULTI_AGY':
                index.append('MULTI_AGY')
            elif d['donor_type_lvl1'] == 'PROG CTY' or d['donor_type_lvl1'] == 'NON_PROG CTY':
                index.append(d['donor_type_lvl3'])
            else:
                index.append('OTH')
        donor_index.append(dict(zip(donorIndexHeader, index)))

print "Donor Index Process Count: %d" % row_count
writeout = json.dumps(donor_index, sort_keys=True, separators=(',',':'))
f_out = open('../api/donor-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Process Donor Type Index
# ************************
donor_types = csv.DictReader(open('download/undp_export/report_donors.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_types_sort = sorted(donor_types, key = lambda x: x['donor_type_lvl1'])

row_count = 0
dtype_index = []
dtypeHeader = ['id','name']
for don,donor in groupby(donor_types_sort, lambda x: x['donor_type_lvl1']): 
    row_count = row_count + 1
    index = []
    if don.replace(" ","") != "":
        index.append(don.replace(" ",""))
        for d in donor:
            index.append(d['donor_type_lvl1_descr'])
        dtype_index.append(dict(zip(dtypeHeader, index)))

print "Donor Type Index Process Count: %d" % row_count
writeout = json.dumps(dtype_index, sort_keys=True, separators=(',',':'))
f_out = open('../api/donor-type-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# # Process Donor Country Index
# # ************************
donor_country = csv.DictReader(open('download/undp_export/report_donors.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_country_sort = sorted(donor_country, key = lambda x: x['donor_type_lvl3'])

row_count = 0
dctry_index = [
    {"id": "OTH","name": "Others"},
    {"id": "MULTI_AGY","name": "Multi-lateral Agency"}
]
dctryHeader = ['id','name']
dlvl1_check = []
for don,donor in groupby(donor_country_sort, lambda x: x['donor_type_lvl3']):
    row_count = row_count + 1
    index = []
    for d in donor:
        if d['donor_type_lvl1'] == 'PROG CTY' or d['donor_type_lvl1'] == 'NON_PROG CTY':
            if don.replace(" ","") != "":
                index.append(don.replace(" ",""))
                index.append(d['donor_type_lvl3_descr'])
    if index:
        dctry_index.append(dict(zip(dctryHeader, index)))

print "Donor Country Index Process Count: %d" % row_count
writeout = json.dumps(dctry_index, sort_keys=True, separators=(',',':'))
f_out = open('../api/donor-country-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Process Focus Area Index
# ************************
outputsFA = csv.DictReader(open('download/undp_export/report_outputs.csv', 'rb'), delimiter = ',', quotechar = '"')
outputsFA_sort = sorted(outputsFA, key = lambda x: x['focus_area'])

row_count = 0
fa_index = []
faHeader = ['id','name']
for fa,focus in groupby(outputsFA_sort, lambda x: x['focus_area']): 
    row_count = row_count + 1
    index = []
    if fa != "":
        index.append(fa)
        for fo in focus:
            index.append(fo['fa_description'])
        fa_index.append(dict(zip(faHeader, index)))

print "Focus Area Index Process Count: %d" % row_count
writeout = json.dumps(fa_index, sort_keys=True, separators=(',',':'))
f_out = open('../api/focus-area-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Process HDI
# ************************
hdi = csv.DictReader(open('hdi/hdi-csv-clean.csv', 'rb'), delimiter = ',', quotechar = '"')
geo = csv.DictReader(open('process_files/country-centroids.csv', 'rb'), delimiter = ',', quotechar = '"')

hdi_sort = sorted(hdi, key = lambda x: x['hdi2011'], reverse = True)
country_sort = sorted(geo, key = lambda x: x['iso3'])

years = [1980,1985,1990,1995,2000,2005,2006,2007,2008,2011]
current_year = 2011

row_count = 0
rank = 0
hdi_index = []
hdi_dict = {}
for val in iter(hdi_sort):
    row_count = row_count + 1
    hdi_total = []
    hdi_health = []
    hdi_ed = []
    hdi_inc = []
    change = []
    change_year = {}
    for y in years:
        if val['hdi%d' % y] != '':
            hdi_total.append([y,float(val['hdi%d' % y])])
            hdi_health.append([y,float(val['health%d' % y])])
            hdi_ed.append([y,float(val['ed%d' % y])])
            hdi_inc.append([y,float(val['income%d' % y])])
            if y != current_year:
                change_year = float(val['hdi%d' % current_year]) - float(val['hdi%d' % y])
                if len(change) == 0:
                    change.append(change_year)
                
    if len(change) == 0:
        change.append("")
    for ctry in country_sort:
        if ctry['name'] == val['country']:
            if val['hdi%d' % current_year] == "":
                g = {
                    "id": ctry['iso3'],
                    "name": val['country'],
                    "hdi": "",
                    "health": "",
                    "income": "",
                    "education": "",
                    "change": change[0],
                    "rank": "n.a."
                }
            else:
                if ctry['iso3'].rfind("A-",0,2) == 0:
                    g = {
                        "id": ctry['iso3'],
                        "name": val['country'],
                        "hdi": hdi_total,
                        "health": hdi_health,
                        "income": hdi_inc,
                        "education": hdi_ed,
                        "change": change[0],
                        "rank": "n.a."
                    }
                else:
                    rank = rank + 1
                    
                    g = {
                        "id": ctry['iso3'],
                        "name": val['country'],
                        "hdi": hdi_total,
                        "health": hdi_health,
                        "income": hdi_inc,
                        "education": hdi_ed,
                        "change": change[0],
                        "rank": rank
                    }
            hdi_index.append(g)
            uid = ctry['iso3']
            hdi_dict[uid] = copy.deepcopy(g)
            hdi_dict[uid].pop('id')
            hdi_dict[uid].pop('name')
            
hdi_dict['total'] = rank

hdi_index_sort = sorted(hdi_index, key = lambda x: x['rank'])
hdi_writeout = json.dumps(hdi_index_sort, sort_keys=True, separators=(',',':'))
hdi_out = open('../api/hdi.json', 'wb')
hdi_out.writelines(hdi_writeout)
hdi_out.close()

jsvalue = "var HDI = "
jsondump = json.dumps(hdi_dict, sort_keys=True, separators=(',',':'))
writeout = jsvalue + jsondump
f_out = open('../api/hdi.js', 'wb')
f_out.writelines(writeout)
f_out.close()
  
# Process Operating Unit Index
# ****************************
unitsIndex = csv.DictReader(open('download/undp_export/report_units.csv', 'rb'), delimiter = ',', quotechar = '"')
unitsIndex_sort = sorted(unitsIndex, key = lambda x: x['operating_unit'])

row_count = 0
opUnit_index = []
opUnitHeader = ['id','name','web','email','project_count','funding_sources_count','budget_sum','expenditure_sum','lat','lon','iso_num']
for un,unit in groupby(unitsIndex_sort, lambda x: x['operating_unit']): 
    index = []
    if un != "":
        index.append(un)
        for ctry in country_sort:
            if ctry['iso3'] == un:
                row_count = row_count + 1
                for u in unit:
                    index.append(u['ou_descr'])
                    index.append(u['web'])
                    index.append(u['email'])
                for x in opUnitprint:
                    if x['operating_unit'] == un:
                        index.append(x['project_count'])
                        index.append(x['funding_sources_count'])
                        index.append(x['budget_sum'])
                        index.append(x['expenditure_sum'])
                if ctry['lat'] != "":
                    index.append(float(ctry['lat']))
                    index.append(float(ctry['lon']))
                for c in iso_sort:
                    # Correct encoding for the match below
                    numTemp = c['iso_num'].decode('utf-8')
                    numDecode = numTemp.encode('ascii','ignore')
                    isoTemp = c['iso3'].decode('utf-8')
                    isoDecode = isoTemp.encode('ascii', 'ignore')
                    if isoDecode == ctry['iso3']:
                        index.append(numDecode)
                # Join values to header and append to final object
                opUnit_index.append(dict(zip(opUnitHeader, index)))
writeout = json.dumps(opUnit_index, sort_keys=True, separators=(',',':'))
f_out = open('../api/operating-unit-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

print "Operating Unit Index Process Count: %d" % row_count

# Top Donor Lists
# ************************
donor_gross = csv.DictReader(open('download/undp_export/donor_gross.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_gross_sort = sorted(donor_gross, key = lambda x: x['donor'])
donor_local = csv.DictReader(open('download/undp_export/donor_local.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_local_sort = sorted(donor_local, key = lambda x: x['donor'])

# Writeout donor gross list
gross_list = []
for g in donor_gross_sort:
    gross = {}
    gross['name'] = g['donor']
    gross['country'] = g['abbrev']
    gross['regular'] = g['regular']
    gross['other'] = g['other']
    gross['total'] = g['total']
    gross_list.append(gross)

writeout = json.dumps(gross_list, sort_keys=True, separators=(',',':'))
f_out = open('../api/top-donor-gross-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Writeout donor local list
local_list = []
for g in donor_local_sort:
    local = {}
    local['country'] = g['abbrev']
    local['name'] = g['donor']
    local['amount'] = g['amount']
    local_list.append(local)
    
writeout = json.dumps(local_list, sort_keys=True, separators=(',',':'))
f_out = open('../api/top-donor-local-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Region Index 
# ************************
exclude = ['PAPP','RBA','RBAP','RBAS','RBEC','RBLAC']

regions = csv.DictReader(open('download/undp_export/report_units.csv', 'rb'), delimiter = ',', quotechar = '"')
regions_sort = sorted(regions, key = lambda x: x['bureau'])

row_count = 0
region_index = []
regionHeader = ['id','name']
region_i = []
index = []
global_i = ['global','Global']
for r,region in groupby(regions_sort, lambda x: x['bureau']): 
    row_count = row_count + 1
    if r in exclude:
        region_i = [r]
        for reg in region:
            if reg['bureau'] == 'PAPP':
                region_i.append(reg['ou_descr'])
                index.append(region_i)
            if reg['hq_co'] == 'HQ':
                if reg['ou_descr'] not in region_i:
                    region_i.append(reg['ou_descr'])
                    index.append(region_i)

index.append(global_i)
index_print = []
for i in index:
    index_print.append(dict(zip(regionHeader, i)))
    
print "Region Index Process Count: %d" % row_count
writeout = json.dumps(index_print, sort_keys=True, separators=(',',':'))
f_out = open('../api/region-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Subnational Locations Index
# ************************
refType = csv.DictReader(open('download/undp_export/ref_typeofproject.csv', 'rb'), delimiter = ',', quotechar = '"')
refType_sort = sorted(refType, key = lambda x: x['id'])
refPrec = csv.DictReader(open('download/undp_export/ref_precisioncodes.csv', 'rb'), delimiter = ',', quotechar = '"')
refPrec_sort = sorted(refPrec, key = lambda x: x['id'])
refScope = csv.DictReader(open('download/undp_export/ref_scopeofproject.csv', 'rb'), delimiter = ',', quotechar = '"')
refScope_sort = sorted(refScope, key = lambda x: x['id'])

ref = {}
ref['type'] = {}
ref['precision'] = {}
ref['scope'] = {}

row_count = 0

for x in refType_sort:
    ref['type'][x['id']] = x['description']
    row_count = row_count + 1
 
for x in refScope_sort:
    ref['scope'][x['id']] = x['description']
    row_count = row_count + 1
 
for x in refPrec_sort:
    ref['precision'][x['id']] = x['description']
    row_count = row_count + 1
    
print "Subnational Location Index Count: %d" % row_count
writeout = json.dumps(ref, sort_keys=True, separators=(',',':'))
f_out = open('../api/subnational-locs-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

t1 = time.time()
total_time = t1-t0
print "Processing complete. Total Processing time = %d seconds" % total_time