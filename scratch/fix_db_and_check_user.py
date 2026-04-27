import paramiko
import os
from dotenv import load_dotenv

def run_remote_mysql(sql_command):
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # root 계정으로 SSH 접속 (비밀번호: Ch070809)
        ssh.connect('210.114.22.136', username='root', password='Ch070809')
        
        # root로 mysql 실행 (비밀번호 동일하다고 가정하거나 -p 없이 시도)
        # 만약 root mysql 비번이 다르면 에러가 나겠지만, 보통 서버 root는 그냥 접속되거나 SSH 비번과 같습니다.
        full_command = f'mysql -u root -pCh070809 smartnanum_db -e "{sql_command}"'
        stdin, stdout, stderr = ssh.exec_command(full_command)
        
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        
        ssh.close()
        return out, err
    except Exception as e:
        return None, str(e)

if __name__ == "__main__":
    # 1. 컬럼 확장
    print("Step 1: Modifying column length...")
    out, err = run_remote_mysql("ALTER TABLE TB_SMS_LOG MODIFY send_category VARCHAR(20);")
    if err and "Warning" not in err: print(f"Error: {err}")
    else: print("Column length updated successfully!")

    # 2. 특정 번호 사용자 확인
    print("\nStep 2: Checking phone 01035617528 in cust table...")
    # 다양한 형식으로 검색
    query = "SELECT cust_no, cust_id, cust_nm, hp_no FROM cust WHERE hp_no LIKE '%01035617528%' OR hp_no LIKE '%821035617528%';"
    out, err = run_remote_mysql(query)
    if out:
        print(f"User found:\n{out}")
    else:
        print("No user found with that number.")
        # 전체 데이터 살짝 확인 (형식 파악용)
        print("\nChecking sample hp_no formats...")
        out, _ = run_remote_mysql("SELECT hp_no FROM cust LIMIT 5;")
        print(f"Sample formats:\n{out}")
