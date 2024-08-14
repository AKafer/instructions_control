#!/usr/bin/bash

python -m pwiz -e postgresql -u postgres -H localhost -p 5432 -P  db_control

#python3 /app/src/worker.py

python3 worker.py
