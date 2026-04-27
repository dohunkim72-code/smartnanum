import mysql.connector

def check_user_data():
    try:
        conn = mysql.connector.connect(
            host='210.114.22.136',
            user='root',
            password='Ch070809',
            database='smartnanum_db'
        )
        cursor = conn.cursor()
        
        # oasis 사용자의 번호 확인
        query = "SELECT id, hpno, LENGTH(hpno) FROM cust WHERE id = 'oasis'"
        cursor.execute(query)
        row = cursor.fetchone()
        
        if row:
            print(f"ID: {row[0]}")
            print(f"HPNO: '{row[1]}'")
            print(f"LENGTH: {row[2]}")
            
            # 다른 번호 형식들도 검색해보기
            print("\nSearching for variants of 01035617528...")
            variants = ['01035617528', '+821035617528', '821035617528']
            for v in variants:
                cursor.execute("SELECT id FROM cust WHERE hpno = %s", (v,))
                match = cursor.fetchone()
                print(f"Match for '{v}': {'Found' if match else 'Not Found'}")
        else:
            print("User 'oasis' not found.")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_user_data()
