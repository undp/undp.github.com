#############################################
# Process and generate all project json files
#############################################

import csv, sys, json

# Open up projects_subprojects.csv
undp_subprojects = csv.DictReader(open('temp-csv/undp-subproject-full.csv', 'rb'), delimiter = ',', quotechar = '"')
undp_projects = csv.DictReader(open('temp-csv/undp-project-full.csv', 'rb'), delimiter = ',', quotechar = '"')


undp_proj_filter = filter(lambda x: x['fiscal_year'] != '2010', undp_projects)

undp_sub_sort = sorted(undp_subprojects, key = lambda x: x['subproject_id'])
undp_proj_sort = sorted(undp_proj_filter, key = lambda x: x['project_id'])

subproj_count = 0
proj_count = 0
subid_count = 0
year_count = 0

print "Processing..."
project_json = []
subproject_list = []
for sval in iter(undp_sub_sort):
    subproj_count = subproj_count + 1
    subproject = {
        "id": sval['subproject_id'],
        "project_id": sval['project_id'],
        "title": sval['subproject_title'],
        "description": sval['subproject_description'],
        "fiscal year": sval['fiscal_year'],
        "budget": sval['budget'],
        "expenditure": sval['expenditure'],
        "donor": sval['donors'],
        "gender code": sval['gender_mark'],
        "focus area": sval['focus_area'],
        "corporate outcome": sval['corporate_outcome'],
        "crs": sval['crs'],
        "start date": sval['subproject_start'],
        "end date": sval['subproject_end']
    } 
    subproject_list.append(subproject) # subproject is now a list of dictionarys that correspond to each row


match_count = 0
project_list = []
for pval in iter(undp_proj_sort):
    proj_count = proj_count + 1
    project = {
        "id": pval['project_id'],
        "fiscal_year": pval['fiscal_year'],
        "title": pval['project_title'],
        "description": pval['project_description'],
        "start": pval['project_start'],
        "end": pval['project_end'],
        "region": pval['region'],
        "operating_unit": pval['operating_unit'],
        "subproject": []
    }
    project_list.append(project)
    

project_json = []
for sub_value in subproject_list:
    for proj_value in project_list:
        if proj_value['id'] == sub_value['project_id']:
            proj_value['subproject'].append(sub_value)
            if proj_value not in project_json:
                project_json.append(proj_value)
    match_count = match_count + 1

print "%d projects processed. Processing complete." % match_count
print "Generating output..."

file_count = 0
for row in project_json:
    file_count = file_count + 1
    writeout = json.dumps(row, sort_keys=True, indent=4)
    f_out = open('api/projects/%s.json' % row['id'], 'wb')
    f_out.writelines(writeout)
    f_out.close()


print 'Total Subprojects: %d' % subproj_count
print 'Total Projects: %d' % proj_count
print 'Processing complete. %d project files generated.' % file_count

