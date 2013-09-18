#!/bin/bash
# ------------------
# UNDP Update Script
# ------------------

echo "Starting update process..."
# Run the python script to process and produce the API JSON files
python undp-process-xml.py
