import mysql.connector

try:
    conn = mysql.connector.connect(
        host="210.114.22.136",
        user="smartuser",
        password="smart1234!",
        database="smartnanum_db"
    )
    cursor = conn.cursor()
    cursor.execute("SELECT USER_ID, HP_NO FROM TB_USER WHERE USER_ID='oasis' OR HP_NO LIKE '%35617528%'")
    rows = cursor.fetchall()
    for row in rows:
        print(f"ID: {row[0]}, HP: {row[1]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
