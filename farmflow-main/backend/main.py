from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from typing import List, Dict, Any
import datetime

import database

app = FastAPI(title="Farm Scheduler API")

origins = [
    "https://farm-work-scheduler.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8081", # Expo web default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_category_from_table(table_name: str) -> str:
    name = table_name.lower()
    if 'bird' in name: return 'birds'
    if 'calf' in name: return 'calves'
    if 'cow' in name: return 'cow_shed'
    if 'fish' in name: return 'fish'
    if 'pond' in name: return 'pond'
    if 'car' in name or 'bike' in name: return 'vehicles'
    return 'maintenance'

@app.get("/")
def read_root():
    return {"message": "Welcome to Farm Scheduler API", "status": "active"}

@app.get("/tasks")
def get_all_tasks(db: Session = Depends(database.get_db)):
    """
    Reads all tables and transforms the raw spreadsheet rows into standard Task objects.
    """
    try:
        inspector = inspect(database.engine)
        tables = inspector.get_table_names()
        
        all_tasks = []
        today_str = datetime.datetime.now().strftime("%a") # e.g. "Fri"
        
        for table in tables:
            category = get_category_from_table(table)
            query = text(f"SELECT * FROM `{table}`")
            result = db.execute(query)
            
            keys = result.keys()
            rows = [dict(zip(keys, row)) for row in result.fetchall()]
            
            if not rows:
                continue
                
            # Row 0 is usually the header row in this schema
            header_row = rows[0]
            
            # Find the column keys
            col_keys = list(header_row.keys())
            if len(col_keys) < 3:
                continue
                
            id_col = col_keys[0] # usually MyUnknownColumn (S.NO)
            desc_col = col_keys[1] # usually Responsible person: ...
            
            # Find the column that corresponds to today
            today_col = None
            for key, val in header_row.items():
                if isinstance(val, str) and val.strip() == today_str:
                    today_col = key
                    break
            
            # Fallback if today's column not found (just use a hardcoded one for testing, e.g., Jun-26 or last column)
            if not today_col:
                if 'Jun-26' in col_keys:
                    today_col = 'Jun-26'
                else:
                    today_col = col_keys[-1] # fallback to last column
            
            # Process data rows (skip row 0)
            for row in rows[1:]:
                # skip empty rows
                if not row.get(id_col) or not row.get(desc_col) or str(row.get(id_col)).strip() == '':
                    continue
                
                # S.NO is string like "1", "2"
                row_id = str(row.get(id_col)).strip()
                if row_id.upper() in ['S.NO', 'SL.NO.', 'SL.NO', 'S.NO.', 'ID']:
                    continue
                    
                title = str(row.get(desc_col)).strip()
                
                status_val = str(row.get(today_col, '')).strip().upper()
                status = 'completed' if status_val == 'YES' else 'pending'
                
                task = {
                    "id": f"{table}::{row_id}",
                    "title": title,
                    "category": category,
                    "subcategory": "Daily Routine",
                    "status": status,
                    "assignedTo": "Unassigned",
                    "priority": "medium",
                }
                all_tasks.append(task)
                
        return all_tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks/{task_id}/toggle")
def toggle_task(task_id: str, payload: dict = Body(...), db: Session = Depends(database.get_db)):
    """
    Toggles the task status in the specific database table and column.
    """
    try:
        if "::" not in task_id:
            raise HTTPException(status_code=400, detail="Invalid task ID format")
            
        table_name, row_id = task_id.split("::", 1)
        
        # Verify table exists
        inspector = inspect(database.engine)
        tables = inspector.get_table_names()
        if table_name not in tables:
            raise HTTPException(status_code=404, detail="Table not found")
            
        # Determine the column to update (same logic as GET)
        query = text(f"SELECT * FROM `{table_name}` LIMIT 1")
        result = db.execute(query)
        keys = result.keys()
        row_0 = dict(zip(keys, result.fetchone()))
        
        today_str = datetime.datetime.now().strftime("%a")
        today_col = None
        for key, val in row_0.items():
            if isinstance(val, str) and val.strip() == today_str:
                today_col = key
                break
                
        if not today_col:
            col_keys = list(row_0.keys())
            if 'Jun-26' in col_keys:
                today_col = 'Jun-26'
            else:
                today_col = col_keys[-1]
                
        id_col = list(row_0.keys())[0]
        
        # Determine new status from frontend request
        new_status_val = "YES" if payload.get("status") == "completed" else "NO"
        
        # Update the database using parameterized query
        # We need to build the update query safely. Column names can have spaces.
        update_query = text(f"UPDATE `{table_name}` SET `{today_col}` = :status_val WHERE `{id_col}` = :row_id")
        db.execute(update_query, {"status_val": new_status_val, "row_id": row_id})
        db.commit()
        
        return {"success": True, "message": f"Task toggled to {new_status_val}"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
