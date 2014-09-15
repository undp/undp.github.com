# ------------------
# UNDP Import Script
# ------------------
# This script runs Python commands to create the JSON API.
# Requirements: Python 2.6 or greater

import time, csv, json,  os, copy, re, sys, urllib
from lxml import etree
from itertools import groupby
from datetime import datetime

t0 = time.time()
print "processing ..."

# Global Processing Arrays
# ********************
tmpYears = []
xmlFiles = []
os.chdir("download/undp_export/iati-xml-annual/")
for fn in os.listdir('.'):
    if fn.endswith(".xml"):
        fileY = fn[-8:-4]  # grab YEAR from file of form "atlas_projects_YEAR.xml"
        tmpYears.append(int(fileY))
        xmlFiles.append(fn)
os.chdir("../../../")
# Sort most recent year first
tmpYears.sort(reverse=True)
xmlFiles.sort(reverse=True)

# Global Output Arrays
# ********************
fiscalYears = []
row_count = 0
outputs = []
locationsFull = []
projectsFull = []
outputsFull = []

# For donor JSONs
cntry_donors = csv.DictReader(open('download/undp_export/country_donors_updated.csv','rb'), delimiter = ',', quotechar = '"')
cntry_donors_sort = sorted(cntry_donors, key = lambda x: x['id'])

# Global Donors Arrays
dctry_index = [
        {"id": "OTH","name": "Others"},
        {"id": "MULTI_AGY","name": "Multi-lateral Agency"}
    ]
donor_index = []
# for donor index JSON
donor_header = ['id','name','country']
donorCtryCheck = []
donorCtry_index = []
# for donor country index JSON
donorCtry_header = ['id','name']
donorCheck = []

# For CRS-index.json
crs_index = []
crsCheck = []
crsHeader = ['id','name']
# For focus-areas.json
focusAreasCheck = []
focusAreas = []

# Read in South-South Projects
# **************************
ss_list = []
ss_projects = csv.DictReader(open('download/undp_export/SSCprojects_IDlist.csv', 'rU'), delimiter = ',', quotechar = '"')
for s in ss_projects:
    ss_list.append(s['projectid'])

# Process donors by Projects
# **************************
donor_projects = csv.DictReader(open('download/undp_export/report_donors.csv', 'rU'), delimiter = ',', quotechar = '"')
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
                try:
                    donorBudget[i] += float(d['budget'])
                except:
                    donorBudget[i] += 0
                try:
                    donorExpend[i] += float(d['expenditure'])
                except:
                    donorExpend[i] += 0
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
                try:
                    donorBudget.append(float(d['budget']))
                except:
                    donorBudget.append(0.0)
                try:
                    donorExpend.append(float(d['expenditure']))
                except:
                    donorExpend.append(0.0)
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
donor_outputs = csv.DictReader(open('download/undp_export/report_donors.csv', 'rU'), delimiter = ',', quotechar = '"')
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
            try:
                donorBudget[i] += float(d['budget'])
            except:
                donorBudget[i] += 0
            try:
                donorExpend[i] += float(d['expenditure'])
            except:
                donorExpend[i] += 0
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
            try:
                donorBudget.append(float(d['budget']))
            except:
                donorBudget.append(0.0)
            try:
                donorExpend.append(float(d['expenditure']))
            except:
                donorExpend.append(0.0)
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

# Outputs function
# ****************
outputsAnnual = {}
locsID = []
for year in tmpYears:
    outputsAnnual[year] = []

def outputsLoop(o, output_id, fileyear):
    try:
        related = o.find("./related-activity[@type='1']")
        relatedArray = related.get('ref').split('-', 2)
    except:
        related = o.find("./related-activity[@type='2']")
        relatedArray = related.get('ref').split('-', 2)

    rltdProject = relatedArray[2]
    outputTitle = o.find("./title").text
    outputDescr = o.find("./description").text
    try:
        gen = o.find(".policy-marker").attrib
        outputGenID = gen.get('code')
        outputGenDescr = o.find(".policy-marker").text
    except:
        outputGenID = "0"
        outputGenDescr = "None"

    # Find sectors for crs-index.json
    outputCRSdescr = []
    outputCRS = []
    sector = o.find("./sector[@vocabulary='DAC']")
    # Set CRS for the output itself
    outputCRSdescr = sector.text
    outputCRS = sector.get('code')

    if sector.text not in crsCheck:
        # Append CRS to global array for index JSON
        sectorTemp = []
        crsCheck.append(sector.text)
        sectorTemp.append(sector.text)
        sectorTemp.append(sector.get('code'))
        crs_index.append(dict(zip(crsHeader, sectorTemp)))

    # Focus areas
    try:
        focusTemp = {}
        outputAll = o.find("./sector[@vocabulary='RO']")
        if rltdProject in ss_list:
            outputFA = '5'
            outputFAdescr = 'South-South'
            # if South-South, mark it, if not then grab the code
        else:
            outputFA = outputAll.get('code')
            outputFAdescr = outputAll.text
        # For focus-areas.json
        if outputFA not in focusAreasCheck:
            focusAreasCheck.append(outputFA)
            focusTemp['id'] = outputFA
            focusTemp['name'] = outputFAdescr
            focusAreas.append(focusTemp)
    except:
        outputFA = "-"
        outputFAdescr = "-"
    outputList = [output_id]
    outputAward = rltdProject
    outputFY = []
    # Donors
    donorIDCheck = []
    donorIDs = []
    donorNames = []
    donorShort = []
    donorTypeID = []
    donorType = []
    donorCtyID = []
    donorCty = []
    for donor in o.findall("./participating-org[@role='Funding']"):
        ref = donor.get('ref')
        if ref not in donorIDCheck:
            donorIDCheck.append(ref)
            donorIDs.append(ref)
            if ref == '00012':
                donorNames.append('Voluntary Contributions')
            else:
                donorNames.append(donor.text)

        for d in cntry_donors_sort:
            # Check IDs from the CSV against the cntry_donors_sort. This provides funding country names not in XML
            if d['id'] == ref:
                # for outputs
                donorShort.append(d['short_descr'])
                if d['donor_type_lvl1'] == 'PROG CTY' or d['donor_type_lvl1'] == 'NON_PROG CTY':
                    donorCtyID.append(d['donor_type_lvl3'].replace(" ",""))
                    donorCty.append(d['donor_type_lvl3_descr'])
                elif d['donor_type_lvl1'] == 'MULTI_AGY':
                    donorCtyID.append(d['donor_type_lvl1'].replace(" ",""))
                    donorCty.append(d['donor_type_lvl1_descr'])
                else:
                    donorCtyID.append('OTH')
                    donorCty.append('OTHERS')
                donorTypeID.append(d['donor_type_lvl1'])

                # for donor-index.json
                # Check for duplicates in donorCheck array
                if ref not in donorCheck:
                    donorTemp = []
                    donorCtryTemp = []
                    donorCheck.append(ref)
                    donorTemp.append(ref)
                    if not donor.text:
                        donorTemp.append("Unknown")
                    else:
                        donorTemp.append(donor.text)
                    if d['donor_type_lvl1'] == 'PROG CTY' or d['donor_type_lvl1'] == 'NON_PROG CTY':
                        donorTemp.append(d['donor_type_lvl3'].replace(" ",""))
                    elif d['donor_type_lvl1'] == 'MULTI_AGY':
                        donorTemp.append(d['donor_type_lvl1'].replace(" ",""))
                    else:
                        donorTemp.append('OTH')
                    donor_index.append(dict(zip(donor_header,donorTemp)))
                if d['donor_type_lvl3'] not in donorCtryCheck:
                    if d['donor_type_lvl1'] == 'PROG CTY' or d['donor_type_lvl1'] == 'NON_PROG CTY':
                        donorCtryCheck.append(d['donor_type_lvl3'])
                        donorCtryTemp.append(d['donor_type_lvl3'])
                        donorCtryTemp.append(d['donor_type_lvl3_descr'])
                        dctry_index.append(dict(zip(donorCtry_header,donorCtryTemp)))

    # Find budget information to later append to projectFY array
    outputBudgetTemp = {}
    budgets = o.findall("./budget")
    for budget in budgets:
        for b in budget.iterchildren(tag='value'):
            date = b.get('value-date').split('-', 3)
            amt = b.text
            year = date[0]
            outputBudgetTemp[year] = float(amt)

            if year not in fiscalYears:
                # Append to global array for year-index.js
                fiscalYears.append(year)
            if year not in outputFY:
                # Append to output array
                outputFY.append(year)

    # Use transaction data to get expenditure
    outputExpendTemp = {}
    transactions = o.findall('transaction')
    loop = 0
    for tx in transactions:
        for expen in tx.findall("./transaction-type[@code='E']"):
            loop = loop + 1
            eVal = []
            for sib in expen.itersiblings():
                if sib.tag == 'value':
                    date = sib.get('value-date').split('-', 3)
                    amt = sib.text
                    year = date[0]
                    outputExpendTemp[year] = []
                    outputExpendTemp[year] = float(amt)
                    eVal.append(float(amt))
                    if year not in fiscalYears:
                        # Append to global array for year-index.js
                        fiscalYears.append(year)
                    if year not in outputFY:
                        # Append to output array
                        outputFY.append(year)
    outputBudget = []
    outputExpend = []
    for y in outputFY:
        try:
            outputExpend.append(outputExpendTemp[y])
        except KeyError:
            outputExpend.append(None)
        try:
            outputBudget.append(outputBudgetTemp[y])
        except KeyError:
            outputBudget.append(None)

    locHeader = ['awardID','outputID','output_locID','focus_area','focus_area_descr','lat','lon','precision','name','type']
    locations = o.findall('location')
    locID = 0
    for location in locations:
        locTemp = []
        awardID = rltdProject
        for loc in location.iterchildren():
            if loc.tag == 'coordinates':
                lat = loc.get('latitude')
                lon = loc.get('longitude')
                precision = loc.get('precision')
            if loc.tag == 'name':
                name = loc.text
            if loc.tag == 'location-type':
                locType = loc.get('code')
        locTemp.append(awardID)
        locTemp.append(output_id)
        locID = locID + 1
        output_locID = "%s-%d" % (output_id, locID)
        locTemp.append(output_locID)
        locTemp.append(outputFA)
        locTemp.append(outputFAdescr)
        locTemp.append(lat)
        locTemp.append(lon)
        locTemp.append(precision)
        locTemp.append(name)
        locTemp.append(locType)
        if output_locID not in locsID:
            locsID.append(output_locID)
            locationsFull.append(dict(zip(locHeader,locTemp)))
    outputsHeader = ['output_id','award_id','output_title','output_descr','gender_id','gender_descr','focus_area','focus_area_descr','crs','crs_descr','fiscal_year','budget','expenditure','donor_id','donor_short','donor_name']
    outputList.append(outputAward)
    outputList.append(outputTitle)
    outputList.append(outputDescr)
    outputList.append(outputGenID)
    outputList.append(outputGenDescr)
    outputList.append(outputFA)
    outputList.append(outputFAdescr)
    outputList.append(outputCRS)
    outputList.append(outputCRSdescr)
    outputList.append(outputFY)
    outputList.append(outputBudget)
    outputList.append(outputExpend)
    outputList.append(donorIDs)
    outputList.append(donorShort)
    outputList.append(donorNames)
    outputsAnnual[fileyear].append(dict(zip(outputsHeader,outputList))) # this returns a list of dicts of output informaiton for each output

# Global project arrays
projects = []
projectsHeader = [
        'project_id','operating_unit','operating_unit_id','iati_op_id','operating_unit_email',
        'operating_unit_website','project_title','project_descr','start','end','inst_id',
        'inst_descr','inst_type_id','document_name'
        ]
units = csv.DictReader(open('download/undp_export/report_units.csv', 'rU'), delimiter = ',', quotechar = '"')
units_sort = sorted(units, key = lambda x: x['operating_unit'])
iati_regions = csv.DictReader(open('download/undp_export/iati_regions.csv', 'rb'), delimiter = ',', quotechar = '"')
iati_regions_sort = sorted(iati_regions, key = lambda x: x['code'])

projectsAnnual = {}
for year in tmpYears:
    projectsAnnual[year] = []

def loopData(file_name, key, fileYear):
    # Get IATI activities XML
    context = iter(etree.iterparse(file_name,tag='iati-activity'))
    # Loop through each IATI activity in the XML
    for event, p in context:
        docTemp = []
        # IATI hierarchy used to determine if output or input1
        hierarchy = p.attrib['hierarchy']
        current = p.attrib['default-currency']
        awardArray = p[1].text.split('-', 2)
        award = awardArray[2]
        implement = p.find("./participating-org[@role='Implementing']")
        if hierarchy == '2':
            # Send the outputs to a separate function, to be joined to their projects later in step 2 below.
            outputsLoop(p, award, fileYear)
        # Check for projects
        if hierarchy == '1':
            projectList = [award]
            docTemp = []
            subnationalTemp = []
            award_title = p.find("./title").text
            award_title.lower()
            award_description = p.find("./description").text
            # Get document-links
            documents = p.findall("./document-link")
            docLinks = []
            docNames = []
            for doc in documents:
                docLinks.append(urllib.unquote(doc.get('url')).decode('utf-8'))
                for d in doc.iterchildren(tag='title'):
                    docNames.append(d.text)
            if docNames:
                docTemp.append(docNames)
                docTemp.append(docLinks)
            # Find start and end dates
            start_date = p.find("./activity-date[@type='start-actual']").text
            end_date = p.find("./activity-date[@type='end-planned']").text
            # Find operatingunit
            try:
                op_unit = p.find("./recipient-country").attrib
                ou_descr = p.find("./recipient-country").text
                iat_code = op_unit.get('code')
                for r in units_sort:
                    if iat_code == r['iati_operating_unit'] or iat_code == r['operating_unit']:
                        operatingunit = r['operating_unit']
            except:
                region_unit = p.findall("./recipient-region")
                for ru in region_unit:
                    for r in units_sort:
                        if ru.text == r['ou_descr']:
                            operatingunit = r['operating_unit']
                            ou_descr = r['ou_descr']
                iat_code = '998'
            projectList.append(ou_descr)
            projectList.append(operatingunit)
            projectList.append(iat_code)

            # find contact info
            try:
                op_contact = p.findall("./contact-info")
                for email in op_contact:
                    for e in email.iterchildren(tag='email'):
                        op_email = e.text
                op_website = p.find("./activity-website").text
                projectList.append(op_email)
                projectList.append(op_website)
            except:
                # append empty email and website if not found
                projectList.append("")
                projectList.append("")
            # Append the remaining items to the project Array
            projectList.append(award_title)
            projectList.append(award_description)
            projectList.append(start_date)
            projectList.append(end_date)
            # Check for implementing organization
            try:
                inst = p.find("./participating-org[@role='Implementing']").attrib
                inst_descr = p.find("./participating-org[@role='Implementing']").text
                institutionid = inst.get('ref')
                inst_type_id = inst.get('type')
                projectList.append(institutionid)
                projectList.append(inst_descr)
                projectList.append(inst_type_id)
            except:
                projectList.append("")
                projectList.append("")
                projectList.append("")
            projectList.append(docTemp)
            projectsAnnual[fileYear].append(dict(zip(projectsHeader,projectList))) # this joins project information, output per project, and documents for each project

# This is the function that creates project summary files
# *******************************************
def createSummary():
    regionsList = ['PAPP','RBA','RBAP','RBAS','RBEC','RBLAC']
    row_count = 0
    yearList = []
    projectSumHeader = [
            'fiscal_year','id','name','operating_unit','region',
            'budget','expenditure','crs','focus_area','donors','donor_types',
            'donor_countries','donor_budget','donor_expend'
            ]
    projectCount = {}
    projectBudget = {}
    projectExpend = {}

    for year in fiscalYears:
        projectCount[year] = 0
        budgetSum = []
        expendSum = []
        projectSummary = []
        yearSummary = {'year':"",'summary':""}
        for row in projectsFull:
            for y in row['fiscal_year']:
                if y == year:
                    projectCount[year] += 1
                    summaryList = [year]
                    summaryList.append(row['project_id'])
                    projectFY = []
                    docTemp = []
                    summaryList.append(row['project_title'])
                    summaryList.append(row['operating_unit_id'])
                    if row['region_id'] not in regionsList:
                        summaryList.append('global')
                    else:
                        summaryList.append(row['region_id'])
                    crsTemp = []
                    faTemp = []
                    dTemp = []
                    dtypeTemp = []
                    dCtyTemp = []
                    budgetT = []
                    expendT = []
                    dBudget = []
                    dExpend = []
                    if year in donorYearList:
                        for dProj in donorYearList[year]:
                            if dProj['projectID'] == row['project_id']:
                                dTemp = dProj['donorID']
                                dtypeTemp = dProj['donorTypeID']
                                dCtyTemp = dProj['donorCtyID']
                                dBudget = dProj['donorBudget']
                                dExpend = dProj['donorExpend']
                    for out in row['outputs']:
                        for idx, yr in enumerate(out['fiscal_year']):
                            if  yr == year:
                                b = out['budget'][idx]
                                e = out['expenditure'][idx]
                                if b is not None:
                                    budgetT.append(b)
                                if e is not None:
                                    expendT.append(e)
                                if out['crs'] not in crsTemp:
                                    crsTemp.append(out['crs'])
                                if out['focus_area'] not in faTemp:
                                    faTemp.append(out['focus_area'])
                    summaryList.append(sum(budgetT))
                    budgetSum.append(sum(budgetT))
                    summaryList.append(sum(expendT))
                    expendSum.append(sum(expendT))
                    summaryList.append(crsTemp)
                    summaryList.append(faTemp)
                    summaryList.append(dTemp)
                    summaryList.append(dtypeTemp)
                    summaryList.append(dCtyTemp)
                    summaryList.append(dBudget)
                    summaryList.append(dExpend)
                    projectSummary.append(dict(zip(projectSumHeader,summaryList))) # this joins the project summary information
        projectBudget[year] = sum(budgetSum)
        projectExpend[year] = sum(expendSum)
        yearSummary['year'] = year
        yearSummary['summary'] = projectSummary
        yearList.append(yearSummary)

    print "Project Summary Process Count by Budget Year: %s" % projectCount
    print "Project Summary Process Total Budget by Year: %s" % projectBudget
    print "Project Summary Process Total Expend by Year: %s" % projectExpend

    for y in yearList:
        jsvalue = "var SUMMARY = "
        jsondump = json.dumps(y['summary'], sort_keys=True, separators=(',',':'))
        writeout = jsvalue + jsondump
        f_out = open('../api/project_summary_%s.js' % y['year'], 'wb')
        f_out.writelines(writeout)
        f_out.close()
        f_out = open('../api/project_summary_%s.json' % y['year'], 'wb')
        f_out.writelines(jsondump)
        f_out.close()
    print 'Project Summary json files generated...'

# This is the function that collects and creates projectsFull
# *******************************************
def collectProjects():
    projectsFullid = []
    projectsDup = {}
    projectCount = {}
    for y in tmpYears:
        projectsDup[y] = []
        projectCount[y] = 0

    for year,proj in projectsAnnual.iteritems():
        for p in proj:
            if year == tmpYears[0]:
                if p['project_id'] not in projectsFullid:
                    projectsFull.append(p)
                    # create array to use to check if project is listed in current year
                    projectsFullid.append(p['project_id'])
                    projectCount[year] += 1
            else:
                projectsDup[year].append(p)
                projectCount[year] += 1

    for y in tmpYears[1:]:
        for d in projectsDup[y]:
            if d['project_id'] not in projectsFullid:
                projectsFull.append(d)
                projectsFullid.append(d['project_id'])

    print "Total Project Count by file year: %s " % projectCount

# This is the function that collects and creates outputsFull
# *******************************************
def collectOutputs():
    outputsFullid = []
    outputsDup = {}
    outputCount = {}
    for y in tmpYears:
        outputsDup[y] = []
        outputCount[y] = 0

    for year,out in outputsAnnual.iteritems():
        for o in out:
            if year == tmpYears[0]:
                if o['output_id'] not in outputsFullid:
                    outputsFull.append(o)
                    # create array to use to check if project is listed in current year
                    outputsFullid.append(o['output_id'])
                    outputCount[year] += 1
            else:
                outputsDup[year].append(o)
                outputCount[year] += 1

    for y in tmpYears[1:]:
        for d in outputsDup[y]:
            if d['output_id'] not in outputsFullid:
                outputsFull.append(d)
                outputsFullid.append(d['output_id'])

    print "Total Output Count by file year: %s " % outputCount

# This is the function that joins master outputs with master projects list
# ***********************************************************************
opUnits = [] # defined outside of function to declare globally
def joinOutputs():
    for row in projectsFull:
        if row['operating_unit_id'] not in opUnits:
            opUnits.append(row['operating_unit_id'])
        row['outputs'] = []
        row['budget'] = []
        row['expenditure'] = []
        row['subnational'] = []
        row['fiscal_year'] = []
        budget = []
        expen = []
        for o in outputsFull:
            if row['project_id'] == o['award_id']:
                row['outputs'].append(o)
                for b in o['budget']:
                    if b is not None:
                        budget.append(b)
                for e in o['expenditure']:
                    if e is not None:
                        expen.append(e)
                for y in o['fiscal_year']:
                    if y not in row['fiscal_year']:
                        # Append to output array
                        row['fiscal_year'].append(y)
        row['budget'].append(sum(budget))
        row['expenditure'].append(sum(expen))
        for l in locationsFull:
            if row['project_id'] == l['awardID']:
                row['subnational'].append(l)
        row['region_id'] = 'global'
        for r in units_sort:
            if row['iati_op_id'] == r['iati_operating_unit'] or row['iati_op_id'] == r['operating_unit']:
                row['region_id'] = r['bureau']

# 1. Scipt starts here
# *****************
# Specify XML project file location
os.chdir("download/undp_export/iati-xml-annual/")
for fn in xmlFiles:
    fileYear = fn[-8:-4]
    loopData(fn,'document-link',int(fileYear))
os.chdir("../../../")

# 2. Assemble a projectsFull array
collectProjects()

# 3. Assemble a outputsFull array
collectOutputs()

# 4. Joing outputs to projects
joinOutputs()

# 5. Run summary file function, on already joined project and output files
# ***********************
createSummary()

# 6. Generate JSONs
# ****************

# Generate JSONs for each project
file_count = 0
for row in projectsFull:
    file_count = file_count + 1
    writeout = json.dumps(row, sort_keys=True, separators=(',',':'))
    f_out = open('../api/projects/%s.json' % row['project_id'], 'wb')
    f_out.writelines(writeout)
    f_out.close()
print '%d project files generated...' % file_count

# Sort projects by operating unit
# ********************************
iso = csv.DictReader(open('download/undp_export/country_iso.csv', 'rb'), delimiter = ',', quotechar = '"')
iso_sort = sorted(iso, key = lambda x: x['iso3'])

unitFinal = []
unitHeader = ['op_unit','projects','iso_num']
for unit in opUnits:
    info = []
    listing = []
    info.append(unit)
    for proj in projectsFull:
        if unit == proj['operating_unit_id']:
            listingTemp = {}
            listingTemp['subnational'] = proj['subnational']
            listingTemp['id'] = proj['project_id']
            listingTemp['title'] = proj['project_title']
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
for u in unitFinal:
    file_count = file_count + 1
    writeout = json.dumps(u, sort_keys=True, separators=(',',':'))
    f_out = open('../api/units/%s.json' % u['op_unit'], 'wb')
    f_out.writelines(writeout)
    f_out.close()
print '%d operating unit files generated...' % file_count

# Process CRS Index
# *****************

# (When we switch to sectors) add colors for each sector
# markerColors = ['3966EB','D54A45','2C3B2C','62752E','1B2706','440BAF','774B19','1464F8','06B8BD','7D9959','0AD057','FCF481','D954E5','CFB887','5F4F8A']
# for idx, e in enumerate(crs_index):
#    crs_index[idx]['color'] = markerColors[idx]

print "CRS Index Process Count: %d" % len(crs_index)
writeout = json.dumps(crs_index, sort_keys=True, separators=(',',':'))
f_out = open('../api/crs-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Process Donor Index
# *****************
for d in donor_index:
    if d['name'] == None:
        print "this is null"
        d['name'] = 'Others'
print "Donor Index Process Count: %d" % len(donor_index)
writeout = json.dumps(donor_index, sort_keys=True, separators=(',',':'))
f_out = open('../api/donor-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Process Donor Country Index
# *****************
print "Donor Country Index Process Count"
writeout = json.dumps(dctry_index, sort_keys=True, separators=(',',':'))
f_out = open('../api/donor-country-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Make year index
# ***************
yearJSvalue = "var FISCALYEARS ="
fiscalYears.sort(reverse=True)
writeout = "%s %s" % (yearJSvalue, fiscalYears)
f_out = open('../api/year-index.js', 'wb')
f_out.writelines(writeout)
f_out.close()

# Top Donor Lists
# ************************
donor_gross = csv.DictReader(open('download/undp_export/donor_gross.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_gross_sort = sorted(donor_gross, key = lambda x: x['donor'])
donor_local = csv.DictReader(open('download/undp_export/donor_local.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_local_sort = sorted(donor_local, key = lambda x: x['donor'])

# Writeout donor gross list
# ************************
gross_list = []
for g in donor_gross_sort:
    gross = {}
    gross['name'] = g['donor']
    gross['country'] = g['abbrev']
    gross['regular'] = g['regular']
    gross['other'] = g['other']
    gross['total'] = g['total']
    for d in cntry_donors_sort:
        if d['donor_type_lvl3_descr'] == g['donor']:
            gross['donor_id'] = d['id']
    gross_list.append(gross)

writeout = json.dumps(gross_list, sort_keys=True, separators=(',',':'))
f_out = open('../api/top-donor-gross-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Writeout donor local list
# ************************
local_list = []
for g in donor_local_sort:
    local = {}
    local['country'] = g['abbrev']
    local['name'] = g['donor']
    local['amount'] = g['amount']
    for d in cntry_donors_sort:
        if d['donor_type_lvl3_descr'] == g['donor']:
            local['donor_id'] = d['id']
    local_list.append(local)

writeout = json.dumps(local_list, sort_keys=True, separators=(',',':'))
f_out = open('../api/top-donor-local-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Region Index
# ************
exclude = ['PAPP','RBA','RBAP','RBAS','RBEC','RBLAC']
row_count = 0
region_index = []
regionHeader = ['id','name']
region_i = []
index = []
global_i = ['global','Global']
for r,region in groupby(units_sort, lambda x: x['bureau']):
    row_count = row_count + 1
    if r in exclude:
        region_i = [r]
        for reg in region:
            if reg['bureau'] == 'PAPP':
                region_i.append(reg['ou_descr'])
                index.append(region_i)
            if reg['hq_co'] == 'HQ':
                if reg['ou_descr'] != 'Regional Center - Addis Ababa':
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

# Process Focus Area Index
# ************************
row_count = 0
index = []

# Focus area colors: Green,  Red,  Yellow,   Blue
markerColors = ['6ab139','ff5640','c8c605','049fd9', '0066a0']

for idx, focus in enumerate(focusAreas):
    if focus['name'] == 'Environment & sustainable development':
        focus['color'] = markerColors[0]
    elif focus ['name'] == 'Crisis prevention & recovery':
        focus['color'] = markerColors[1]
    elif focus ['name'] == 'Poverty reduction & MDG achievement':
        focus['color'] = markerColors[2]
    elif focus ['name'] == 'Democratic governance':
        focus['color'] = markerColors[3]
    elif focus ['name'] == 'South-South':
        focus['color'] = markerColors[4]
    row_count = row_count + 1
    index.append(focus)

print "Focus Area Index Process Count: %d" % row_count
writeout = json.dumps(index, sort_keys=True, separators=(',',':'))
f_out = open('../api/focus-area-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Process HDI
# ************************
# Make sure you have a clean CSV. Run CSVkit to clean.
hdi = csv.DictReader(open('hdi/hdi-csv-clean.csv', 'rU'), delimiter = ',', quotechar = '"')
geo = csv.DictReader(open('process_files/country-centroids.csv', 'rb'), delimiter = ',', quotechar = '"')

hdi_sort = sorted(hdi, key = lambda x: x['hdi2013'], reverse = True)
country_sort = sorted(geo, key = lambda x: x['iso3'])

# Add current year to the years array
years = [1980,1985,1990,1995,2000,2005,2006,2007,2008,2011,2012,2013]
# Set current year to the latest year of HDI Data
current_year = 2013

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
            if val['ed%d' % y] != "" and val['health%d' % y] != "" and val['income%d' % y] != "":
                hdi_total.append([y,round(float(val['hdi%d' % y]),3)])
                hdi_health.append([y,round(float(val['health%d' % y]),3)])
                hdi_ed.append([y,round(float(val['ed%d' % y]),3)])
                hdi_inc.append([y,round(float(val['income%d' % y]),3)])
                if y != current_year:
                    change_year = round(float(val['hdi%d' % current_year]),3) - round(float(val['hdi%d' % y]),3)
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
currentYear = fiscalYears[0]
opIndex = []
opIndexHeader =  [
        'id','name','project_count','funding_sources_count',
        'budget_sum','expenditure_sum','lat','lon','iso_num', 'fund_type'
        ]
for unit in opUnits:
    opTemp = {}
    donors = []
    budgetT = []
    expendT = []
    fundType = ''
    for ctry in country_sort:
        if ctry['iso3'] == unit:
            opTemp['name'] = ctry['name']
            if ctry['lat'] != "":
                opTemp['lat'] = float(ctry['lat'])
                opTemp['lon'] = float(ctry['lon'])
            for c in iso_sort:
                # Correct encoding for the match below
                numTemp = c['iso_num'].decode('utf-8')
                numDecode = numTemp.encode('ascii','ignore')
                isoTemp = c['iso3'].decode('utf-8')
                isoDecode = isoTemp.encode('ascii', 'ignore')
                if isoDecode == ctry['iso3']:
                    opTemp['iso_num'] = numDecode
    projectCount = 0
    for row in projectsFull:
        if currentYear in row['fiscal_year']:
            if row['operating_unit_id'] == unit:
                opTemp['name'] = row['operating_unit']
                opTemp['email'] = row['operating_unit_email']
                opTemp['web'] = row['operating_unit_website']
                projectCount = projectCount + 1
                for o in row['outputs']:
                    for d in o['donor_id']:
                        if d not in donors and d != "":
                            donors.append(d)
                    for idx, y in enumerate(o['fiscal_year']):
                        if y == currentYear:
                            b = o['budget'][idx]
                            e = o['expenditure'][idx]
                            if b is not None:
                                budgetT.append(b)
                            if e is not None:
                                expendT.append(e)
    # get the fund type for this operating unit
    for row in units_sort:
      if (unit == row['operating_unit'] or
          unit == row['iati_operating_unit']):
        fundType = row['fund_type']

    opTemp['funding_sources_count'] = len(donors)
    opTemp['budget_sum'] = sum(budgetT)
    opTemp['expenditure_sum'] = sum(expendT)
    opTemp['id'] = unit
    opTemp['project_count'] = projectCount
    opTemp['fund_type'] = fundType
    opIndex.append(opTemp)

writeout = json.dumps(opIndex, sort_keys=True, separators=(',',':'))
f_out = open('../api/operating-unit-index-test.json', 'wb')
f_out.writelines(writeout)
f_out.close()
print "Operating Unit Index Process Count: %d" % row_count

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

# Calculate the total time and print to console.
t1 = time.time()
total_time = (t1-t0)/60
print "Processing complete. Total Processing time = %d minutes" % total_time
