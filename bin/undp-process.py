import csv, sys, json, time
from itertools import groupby

t0 = time.time()

# Process document file by Projects
# ********************************* 
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
donor_projects_sort = sorted(donor_projects, key = lambda x: x['awardID'])

row_count = 0
donorProject = []
donorProjHeader = ['projectID','donorID','donorName','donorShort','donorTypeID','donorType','donorCtyID','donorCty','donorBudget','donorExpend']
for don,donors in groupby(donor_projects_sort, lambda x: x['awardID']):
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

print "Donors by Project Process Count: %d" % row_count
donorProjects = []
for l in donorProject:
    donorProjects.append(dict(zip(donorProjHeader,l))) # this returns a list of dicts of donors for each project

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
outputs_sort = sorted(outputs, key = lambda x: x['projectID'])

row_count = 0
outputs = []
outputsFull = []
outputsHeader = ['output_id','award_id','output_title','output_descr','gender_id','gender_descr','focus_area','focus_area_descr','crs','crs_descr','fiscal_year','budget','expenditure','donor_id','donor_short','donor_name','donor_type_id','donor_type','donor_country_id','donor_country','donor_budget','donor_expend']
for out,output in groupby(outputs_sort, lambda x: x['projectID']): 
    row_count = row_count + 1
    outputList = [out]
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
        outputList.append(o['awardid'])
        outputList.append(o['project_description'])
        outputList.append(o['project_med_de'])
        outputList.append(o['gender_marker'])
        outputList.append(o['gender_marker_descr'])
        outputList.append(o['focus_area'])
        outputList.append(o['fa_description'])
        outputList.append(o['crs'])
        outputList.append(o['crs_descr'])
        outputFY.append(o['fiscal_year'])
        outputBudget.append(float(o['budget']))
        outputExpend.append(float(o['expenditure']))
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
units = csv.DictReader(open('download/undp_export/report_units.csv', 'rb'), delimiter = ',', quotechar = '"')
units_sort = sorted(units, key = lambda x: x['operating_unit'])
bureau = csv.DictReader(open('download/undp_export/regions.csv', 'rb'), delimiter = ',', quotechar = '"')
bureau_sort = sorted(bureau, key = lambda x: x['bureau'])

row_count = 0
projects = []
projectsFull = []
projectsHeader = ['project_id','project_title','project_descr','inst_id','inst_descr','inst_type_id','inst_type_descr','fiscal_year','start','end','operating_unit_id','operating_unit','region_id','region_name','outputs','document_name','document_url']
for award,project in groupby(projects_sort, lambda x: x['awardID']): 
    row_count = row_count + 1
    projectList = [award]
    projectFY = []
    docTemp = []
    for p in project:
        projectList.append(p['award_title'])
        projectList.append(p['award_description'])
        projectList.append(p['institutionid'])
        projectList.append(p['inst_descr'])
        projectList.append(p['inst_type'])
        projectList.append(p['inst_type_descr'])
        if p['fiscal_year'] not in projectFY:
            projectFY.append(p['fiscal_year'])
        projectList.append(projectFY)
        if p['start_date'] not in projectList:
            projectList.append(p['start_date'].rstrip(' 00:00:00.0'))
        if p['end_date'] not in projectList:
            projectList.append(p['end_date'].rstrip(' 00:00:00.0'))
        for op in units_sort:
            if op['operating_unit'] == p['operatingunit']:
                projectList.append(p['operatingunit'])
                projectList.append(op['ou_descr'])
        for b in bureau_sort:
            if b['bureau'] == p['bureau']:
                projectList.append(p['bureau'])
                projectList.append(b['bureau_description'])
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
    projectsFull.append(dict(zip(projectsHeader,projectList))) # this joins project information, output per project, and documents for each project

print "Project Process Count: %d" % row_count

file_count = 0
for row in projectsFull:
    file_count = file_count + 1
    writeout = json.dumps(row, sort_keys=True, separators=(',',':'))
    f_out = open('../api/projects/%s.json' % row['project_id'], 'wb')
    f_out.writelines(writeout)
    f_out.close()
print 'Processing complete. %d project files generated.' % file_count

## Process Project Summary file
# *****************************
projectSum = csv.DictReader(open('download/undp_export/report_projects.csv', 'rb'), delimiter = ',', quotechar = '"')
projectSum_sort = sorted(projectSum, key = lambda x: x['awardID'])

regionsList = ['PAPP','RBA','RBAP','RBAS','RBEC','RBLAC']

row_count = 0
projectSummary = []
projectSumHeader = ['id','name','operating_unit','region','budget','expenditure','crs','focus_area','donors','donor_types','donor_countries','donor_budget','donor_expend']
for award,summary in groupby(projectSum_sort, lambda x: x['awardID']): 
    row_count = row_count + 1
    summaryList = [award]
    projectFY = []
    docTemp = []
    for s in summary:
        summaryList.append(s['award_title'])
        summaryList.append(s['operatingunit'])
        if s['bureau'] not in regionsList:
            summaryList.append('global')
        else:
            summaryList.append(s['bureau'])
        summaryList.append(float(s['budget']))
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
    dTemp = []
    dtypeTemp = []
    dCtyTemp = []
    dBudget = []
    dExpend = []
    for dProj in donorProjects:
        if dProj['projectID'] == award:
            dTemp = dProj['donorID']
            dtypeTemp = dProj['donorTypeID']
            dCtyTemp = dProj['donorCtyID']
            dBudget = dProj['donorBudget']
            dExpend = dProj['donorExpend']
    summaryList.append(dTemp)
    summaryList.append(dtypeTemp)
    summaryList.append(dCtyTemp)
    summaryList.append(dBudget)
    summaryList.append(dExpend)
    
    projectSummary.append(dict(zip(projectSumHeader,summaryList))) # this joins the project summary information 

print "Project Summary Process Count: %d" % row_count

writeout = json.dumps(projectSummary, sort_keys=True, separators=(',',':'))
f_out = open('../api/project_summary.json', 'wb')
f_out.writelines(writeout)
f_out.close()
print 'Processing complete. project_summary.json generated.' 

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
#    opUnitBudget.append(sum(budgetSum))
#    opUnitProj.append(sum(projCount))
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
donorIndexHeader = ['id','name']
for don,donor in groupby(donor_index_sort, lambda x: x['donorID']): 
    row_count = row_count + 1
    index = []
    if don.replace(" ","") != "":
        index.append(don)
        for d in donor:
            if don == '00012':
                index.append('Voluntary Contributions')
            else:
                index.append(d['long_descr'])
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

# Process Donor Country Index
# ************************
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

# Process Operating Unit Index
# ****************************
unitsIndex = csv.DictReader(open('download/undp_export/report_units.csv', 'rb'), delimiter = ',', quotechar = '"')
unitsIndex_sort = sorted(unitsIndex, key = lambda x: x['operating_unit'])
geo = csv.DictReader(open('country-centroids.csv', 'rb'), delimiter = ',', quotechar = '"')
country_sort = sorted(geo, key = lambda x: x['iso3'])

row_count = 0
opUnit_index = []
opUnitHeader = ['id','name','web','email','project_count','funding_sources_count','budget_sum','expenditure_sum','lat','lon']
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
    gross['amount'] = g['amount']
    gross_list.append(gross)

writeout = json.dumps(gross_list, sort_keys=True, separators=(',',':'))
f_out = open('../api/top-donor-gross-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Writeout donor local list
local_list = []
for g in donor_local_sort:
    local = {}
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

t1 = time.time()
total_time = t1-t0
print "Total Processing time = %d seconds" % total_time
