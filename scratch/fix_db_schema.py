import paramiko
import os
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv('server/.env')

def run_sql(sql_command):
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # 서버 접속 정보 (이전 세션 정보 활용)
        ssh.connect('210.114.22.136', username='root', password='Ch070809')
        
        db_user = os.getenv('DB_USER')
        db_pass = os.getenv('DB_PASS')
        db_name = os.getenv('DB_NAME')
        
        # MySQL 명령 실행
        full_command = f'mysql -u{db_user} -p{db_pass} {db_name} -e "{sql_command}"'
        stdin, stdout, stderr = ssh.exec_command(full_command)
        
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        
        if out: print(f"Output: {out}")
        if err: print(f"Error: {err}")
        
        ssh.close()
        return True
    except Exception as e:
        print(f"Failed: {str(e)}")
        return False

if __name__ == "__main__":
    # send_category 컬럼 길이 확장
    print("Modifying TB_SMS_LOG.send_category length...")
    run_sql("ALTER TABLE TB_SMS_LOG MODIFY send_category VARCHAR(20);")
    print("Done.")
