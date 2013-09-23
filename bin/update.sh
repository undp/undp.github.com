#!/bin/bash
# ------------------
# UNDP Update Script
# ------------------

echo "Starting update process..."
# Run the python script to process and produce the API JSON files
python undp-process-xml.py

# Run a zip command to update the zipped download file with new data
cd download/undp_export
zip -j ../../../download/undp-project-data.zip atlas_projects.xml country_donors_updated.csv report_donors.csv report_units.csv donor_gross.csv donor_local.csv ../../hdi/hdi-csv-clean.csv

